package com.semantic.gateway.dto;
import java.time.Instant;
public class ErrorResponse {
    private final Instant timestamp;
    private final int status;
    private final String errorCode;
    private final String message;
    public ErrorResponse(int status, String errorCode, String message) {
        this.timestamp = Instant.now();
        this.status = status; this.errorCode = errorCode; this.message = message;
    }
    public Instant getTimestamp() { return timestamp; }
    public int getStatus() { return status; }
    public String getErrorCode() { return errorCode; }
    public String getMessage() { return message; }
}
