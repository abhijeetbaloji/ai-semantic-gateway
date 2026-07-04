package com.semantic.gateway.exception;

import com.semantic.gateway.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.stream.Collectors;

/**
 * Centralised exception-to-HTTP mapping. No controller needs its own
 * try/catch. No handler includes a stack trace or internal detail in
 * the response body -- all of that goes to the server-side log only.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  /** 400 -- @Valid failed before controller method body ran */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().stream()
        .map(FieldError::getDefaultMessage)
        .collect(Collectors.joining("; "));
    if (message.isBlank()) message = "Validation failed";
    log.debug("Validation failed: {}", message);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "VALIDATION_ERROR", message));
  }

  /**
   * 502 -- upstream (OpenAI) returned a non-2xx.
   * We are a gateway; their error is our Bad Gateway.
   * Upstream status + body logged server-side only.
   */
  @ExceptionHandler(WebClientResponseException.class)
  public ResponseEntity<ErrorResponse> handleUpstreamError(WebClientResponseException ex) {
    log.error("Upstream API error: status={} body={}",
        ex.getStatusCode().value(), ex.getResponseBodyAsString());
    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
        .body(new ErrorResponse(HttpStatus.BAD_GATEWAY.value(),
            "UPSTREAM_ERROR", "The AI service returned an error. Please try again."));
  }

  /**
   * 503 -- Postgres/pgvector unavailable.
   * Signals the client the condition is likely transient.
   */
  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<ErrorResponse> handleDatabaseError(DataAccessException ex) {
    log.error("Database error: {}", ex.getMessage(), ex);
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(new ErrorResponse(HttpStatus.SERVICE_UNAVAILABLE.value(),
            "DATABASE_ERROR", "A storage error occurred. Please try again shortly."));
  }

  /**
   * 500 -- anything else.
   * Full exception logged; client gets only a generic message.
   * If a type lands here repeatedly, promote it to its own handler above.
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
    log.error("Unexpected error processing request", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "INTERNAL_ERROR", "An unexpected error occurred. Please try again."));
  }
}
