package com.dailyeng.auth;

import com.dailyeng.config.AppProperties;
import com.dailyeng.auth.dto.*;
import com.dailyeng.user.User;
import com.dailyeng.common.exception.BadRequestException;
import com.dailyeng.user.UserRepository;
import com.dailyeng.auth.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Duration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

/**
 * Authentication service handling register, login, Google OAuth, and password management.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final VerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final RestClient.Builder restClientBuilder;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";
    
    // Simple in-memory cache to prevent redundant Google API calls for the same token
    // Key: idToken, Value: Google User Info (JsonNode)
    private final Map<String, JsonNode> googleTokenCache = new ConcurrentHashMap<>();

    // ========================
    // Registration & Login
    // ========================

    /**
     * Register a new user with email and password.
     * Ports: registerUser() from auth.ts
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new BadRequestException("Email is already in use");
        }

        var user = User.builder()
                .name(request.name().trim())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();
        userRepository.save(user);

        log.info("User registered: {}", request.email());
        return issueTokens(user);
    }

    /**
     * Authenticate user with email + password, return JWT tokens.
     * Ports: signInWithCredentials() from auth.ts
     */
    public AuthResponse login(LoginRequest request) {
        var user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getId(), request.password())
        );

        log.info("User logged in: {}", request.email());
        return issueTokens(user);
    }

    // ========================
    // Google OAuth
    // ========================

    /**
     * Authenticate via Google OAuth ID token.
     * Ports: signInWithGoogle() from auth.ts
     *
     * <p>Flow:
     * 1. Frontend calls Google Sign-In → gets idToken
     * 2. Frontend sends idToken to POST /auth/google
     * 3. Backend verifies idToken with Google's tokeninfo endpoint
     * 4. Find or create User + Account records
     * 5. Return JWT access + refresh tokens
     *
     * <p>Security: verify audience (aud) matches our Google Client ID
     * to prevent token substitution attacks.
     */
    @Transactional
    public AuthResponse googleLogin(GoogleAuthRequest request) {
        // Step 1: Verify Google ID token via Google's REST endpoint
        JsonNode googleUser = verifyGoogleToken(request.idToken());

        // Step 2: Verify audience matches our Google Client ID
        var aud = googleUser.path("aud").asText();
        var googleClientId = appProperties.getGoogle().getClientId();
        if (googleClientId == null || googleClientId.isBlank()) {
            log.error("GOOGLE_CLIENT_ID not configured — cannot verify Google token audience");
            throw new BadRequestException("Google authentication is not configured");
        }
        if (!aud.equals(googleClientId)) {
            log.warn("Google token audience mismatch: expected={}, got={}", googleClientId, aud);
            throw new BadRequestException("Invalid Google token audience");
        }

        // Step 3: Extract user info
        var googleId = googleUser.path("sub").asText();
        var email = googleUser.path("email").asText();
        var name = googleUser.path("name").asText();
        var picture = googleUser.path("picture").asText();

        if (email == null || email.isBlank()) {
            throw new BadRequestException("Google account does not have an email");
        }

        // Step 4: Find existing account or create new user
        User user = findOrCreateGoogleUser(googleId, email, name, picture);

        // Step 5: Generate JWT tokens
        log.info("Google OAuth login: {}", email);
        return issueTokens(user);
    }

    // ========================
    // Password Management
    // ========================

    /**
     * Send password reset email. Always returns success to prevent user enumeration.
     * Ports: requestPasswordReset() from auth.ts
     */
    @Transactional
    public void forgotPassword(String email) {
        var userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty() || userOpt.get().getPassword() == null) {
            log.debug("Forgot password for non-existent/Google user: {}", email);
            return;
        }

        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);
        var token = HexFormat.of().formatHex(tokenBytes);

        tokenRepository.deleteByIdentifier(email);
        tokenRepository.save(VerificationToken.builder()
                .identifier(email)
                .token(token)
                .expires(LocalDateTime.now().plusHours(1))
                .build());

        emailService.sendPasswordResetEmail(email, token);
        log.info("Password reset requested for: {}", email);
    }

    /**
     * Reset password using token from email.
     * Ports: resetPassword() from auth.ts
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        var verificationToken = tokenRepository
                .findByTokenAndExpiresAfter(request.token(), LocalDateTime.now())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));

        var user = userRepository.findByEmail(verificationToken.getIdentifier())
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        tokenRepository.deleteByIdentifierAndToken(
                verificationToken.getIdentifier(), verificationToken.getToken());

        log.info("Password reset completed for: {}", verificationToken.getIdentifier());
    }

    /**
     * Change password for authenticated user.
     * Ports: changePassword() from auth.ts
     */
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getPassword() == null) {
            throw new BadRequestException("Password change is not available for Google accounts");
        }
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", userId);
    }

    // ========================
    // Private helpers
    // ========================

    private JsonNode verifyGoogleToken(String idToken) {
        // 1. Check cache first
        if (googleTokenCache.containsKey(idToken)) {
            log.debug("Using cached Google token info");
            return googleTokenCache.get(idToken);
        }

        try {
            // 2. Configure Timeout (5 seconds)
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(5000);
            factory.setReadTimeout(5000);

            String url = GOOGLE_TOKENINFO_URL + idToken;
            String responseBody = restClientBuilder
                    .requestFactory(factory)
                    .build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);
            
            JsonNode result = objectMapper.readTree(responseBody);
            
            // 3. Store in cache (limited size or simple cleanup could be added for production)
            if (googleTokenCache.size() > 1000) googleTokenCache.clear(); // Simple eviction
            googleTokenCache.put(idToken, result);
            
            return result;
        } catch (Exception e) {
            log.error("Failed to verify Google ID token (possibly timeout or network error): {}", e.getMessage());
            throw new BadRequestException("Google authentication service is temporarily unavailable or token is invalid");
        }
    }

    private User findOrCreateGoogleUser(String googleId, String email, String name, String picture) {
        var existingAccount = accountRepository.findByProviderAndProviderAccountId("google", googleId);

        if (existingAccount.isPresent()) {
            var user = userRepository.findById(existingAccount.get().getUserId())
                    .orElseThrow(() -> new BadRequestException("User not found for Google account"));
            if (picture != null && !picture.isBlank()) {
                user.setImage(picture);
                userRepository.save(user);
            }
            return user;
        }

        // New Google user — find by email or create
        var user = userRepository.findByEmail(email).orElseGet(() -> {
            var newUser = User.builder()
                    .name(name != null && !name.isBlank() ? name : email.split("@")[0])
                    .email(email)
                    .image(picture)
                    .emailVerified(LocalDateTime.now())
                    .build();
            return userRepository.save(newUser);
        });

        // Create Account record linking Google to this user
        accountRepository.save(Account.builder()
                .userId(user.getId())
                .type("oauth")
                .provider("google")
                .providerAccountId(googleId)
                .build());

        return user;
    }

    private AuthResponse issueTokens(User user) {
        var accessToken = jwtTokenProvider.generateToken(user.getId());
        var refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
        return AuthResponse.success(accessToken, refreshToken, toUserInfo(user));
    }

    private AuthResponse.UserInfo toUserInfo(User user) {
        return new AuthResponse.UserInfo(user.getId(), user.getName(), user.getEmail(), user.getImage());
    }

    /**
     * Get user info by ID. Used by /auth/me to return user data from JWT cookie.
     */
    public AuthResponse.UserInfo getUserInfo(String userId) {
        return userRepository.findById(userId)
                .map(this::toUserInfo)
                .orElse(null);
    }
}
