package com.dailyeng.auth.security;

import com.dailyeng.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import jakarta.servlet.DispatcherType;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration for JWT-based stateless authentication.
 * <p>
 * - CSRF disabled (stateless JWT)
 * - CORS configured for frontend
 * - JWT filter registered before UsernamePasswordAuthenticationFilter
 * - Public endpoints: auth, actuator health
 * - All other endpoints require authentication
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final AppProperties appProperties;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // Allow async dispatches for SSE to finalize without re-authenticating
                        .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
                        // Public endpoints
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/vocab/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/grammar/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/speaking/topic-groups").permitAll()
                        .requestMatchers(HttpMethod.GET, "/speaking/scenarios").permitAll()
                        .requestMatchers(HttpMethod.GET, "/speaking/scenarios/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/speaking/scenarios/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/speaking/speech/voices").permitAll()
                        .requestMatchers(HttpMethod.POST, "/speaking/speech/synthesize").permitAll()
                        .requestMatchers(HttpMethod.GET, "/topic-groups/**").permitAll()
                        // CMS content, placement test questions, dictionary (public)
                        .requestMatchers(HttpMethod.GET, "/site-content/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/placement-test/questions").permitAll()
                        .requestMatchers(HttpMethod.GET, "/dictionary/**").permitAll()
                        // Translation (public)
                        .requestMatchers(HttpMethod.POST, "/translate").permitAll()
                        // SmartLens (public)
                        .requestMatchers(HttpMethod.POST, "/smartlens/**").permitAll()
                        // Actuator
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/actuator/info").permitAll()
                        // Health check endpoint for cold-start prevention (cron-job.org warmup)
                        .requestMatchers(HttpMethod.GET, "/health").permitAll()
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var corsConfig = appProperties.getCors();
        var configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(
                Arrays.asList(corsConfig.getAllowedOrigins().split(","))
        );
        configuration.setAllowedMethods(
                Arrays.asList(corsConfig.getAllowedMethods().split(","))
        );
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(corsConfig.isAllowCredentials());
        configuration.setMaxAge(corsConfig.getMaxAge());

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        var authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig
    ) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Strength 12, matching bcryptjs(password, 12)
    }
}
