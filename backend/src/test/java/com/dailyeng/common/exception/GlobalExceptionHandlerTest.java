package com.dailyeng.common.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link GlobalExceptionHandler}.
 * Directly instantiates the handler — no Spring context needed.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("ResourceNotFoundException returns 404")
    void handleResourceNotFound() {
        var ex = new ResourceNotFoundException("Item not found");
        var response = handler.handleResourceNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().success());
        assertEquals("Item not found", response.getBody().error());
        assertEquals(404, response.getBody().status());
    }

    @Test
    @DisplayName("BadRequestException returns 400")
    void handleBadRequest() {
        var ex = new BadRequestException("Invalid input");
        var response = handler.handleBadRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Invalid input", response.getBody().error());
        assertEquals(400, response.getBody().status());
    }

    @Test
    @DisplayName("UnauthorizedException returns 401")
    void handleUnauthorized() {
        var ex = new UnauthorizedException("Not allowed");
        var response = handler.handleUnauthorized(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Not allowed", response.getBody().error());
        assertEquals(401, response.getBody().status());
    }

    @Test
    @DisplayName("BadCredentialsException returns 401 with Vietnamese message")
    void handleBadCredentials() {
        var ex = new BadCredentialsException("bad creds");
        var response = handler.handleBadCredentials(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Invalid email or password", response.getBody().error());
    }

    @Test
    @DisplayName("AuthenticationException returns 401")
    void handleAuthenticationException() {
        var ex = new InternalAuthenticationServiceException("auth failed");
        var response = handler.handleAuthentication(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Authentication failed", response.getBody().error());
    }

    @Test
    @DisplayName("Generic Exception returns 500 with Vietnamese message")
    void handleGenericException() {
        var ex = new RuntimeException("something broke");
        var response = handler.handleGeneral(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Unexpected Server Error: something broke", response.getBody().error());
        assertEquals(500, response.getBody().status());
    }

    @Test
    @DisplayName("ErrorResponse.of creates correct structure")
    void errorResponseOf() {
        var response = GlobalExceptionHandler.ErrorResponse.of("test error", HttpStatus.FORBIDDEN);

        assertFalse(response.success());
        assertEquals("test error", response.error());
        assertEquals(403, response.status());
        assertNotNull(response.timestamp());
    }
}
