package com.semantic.gateway.exception;

import com.semantic.gateway.controller.QueryController;
import com.semantic.gateway.service.QueryService;
import com.semantic.gateway.service.SettingsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Verifies that GlobalExceptionHandler maps each exception type to the
 * correct HTTP status and errorCode, and that no internal detail (stack
 * traces, exception class names, upstream response bodies) leaks into
 * the client response.
 *
 * These run under @WebMvcTest, which auto-loads @RestControllerAdvice
 * beans as part of the web slice. QueryService is mocked so each test
 * can throw the specific exception under test.
 */
@WebMvcTest(QueryController.class)
class GlobalExceptionHandlerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private QueryService queryService;

  @MockBean
  private SettingsService settingsService;

  @org.junit.jupiter.api.BeforeEach
  void setUp() {
    org.mockito.Mockito.when(settingsService.getMaxPromptLength()).thenReturn(8000);
  }

  private static final String VALID_BODY = "{\"prompt\": \"test prompt\"}";

  // ------------------------------------------------------------------
  // 400 — validation (tested more thoroughly in QueryControllerTest;
  //        one smoke test here just to confirm the handler is wired)
  // ------------------------------------------------------------------

  @Test
  @DisplayName("400: @NotBlank violation returns VALIDATION_ERROR errorCode")
  void blankPrompt_returns400_validationError() throws Exception {
    mockMvc.perform(post("/api/v1/query")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"prompt\": \"\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.timestamp").exists());
  }

  // ------------------------------------------------------------------
  // 502 — upstream (OpenAI) error
  // ------------------------------------------------------------------

  @Test
  @DisplayName("502: WebClientResponseException from QueryService returns UPSTREAM_ERROR, no upstream body leaked")
  void upstreamApiError_returns502() throws Exception {
    WebClientResponseException upstreamEx = WebClientResponseException.create(
        401,
        "Unauthorized",
        null,
        "{\"error\":{\"message\":\"Invalid API key\"}}".getBytes(StandardCharsets.UTF_8),
        StandardCharsets.UTF_8);

    when(queryService.process(any())).thenThrow(upstreamEx);

    mockMvc.perform(post("/api/v1/query")
            .contentType(MediaType.APPLICATION_JSON)
            .content(VALID_BODY))
        .andExpect(status().isBadGateway())
        .andExpect(jsonPath("$.status").value(502))
        .andExpect(jsonPath("$.errorCode").value("UPSTREAM_ERROR"))
        // The raw upstream error body must not appear in our response
        .andExpect(content().string(not(containsString("Invalid API key"))))
        .andExpect(content().string(not(containsString("Unauthorized"))));
  }

  @Test
  @DisplayName("502: upstream 500 also maps to our UPSTREAM_ERROR, not our 500")
  void upstreamServerError_stillReturns502() throws Exception {
    WebClientResponseException upstreamEx = WebClientResponseException.create(
        500, "Internal Server Error", null,
        "upstream internal error".getBytes(StandardCharsets.UTF_8),
        StandardCharsets.UTF_8);

    when(queryService.process(any())).thenThrow(upstreamEx);

    mockMvc.perform(post("/api/v1/query")
            .contentType(MediaType.APPLICATION_JSON)
            .content(VALID_BODY))
        .andExpect(status().isBadGateway())
        .andExpect(jsonPath("$.errorCode").value("UPSTREAM_ERROR"))
        .andExpect(content().string(not(containsString("upstream internal error"))));
  }

  // ------------------------------------------------------------------
  // 503 — database error
  // ------------------------------------------------------------------

  @Test
  @DisplayName("503: DataAccessException returns DATABASE_ERROR, no SQL detail leaked")
  void databaseError_returns503() throws Exception {
    // DataAccessResourceFailureException is a concrete subclass of
    // DataAccessException, the type our handler catches.
    when(queryService.process(any())).thenThrow(
        new DataAccessResourceFailureException("Connection to 10.0.0.1:5432 refused"));

    mockMvc.perform(post("/api/v1/query")
            .contentType(MediaType.APPLICATION_JSON)
            .content(VALID_BODY))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.status").value(503))
        .andExpect(jsonPath("$.errorCode").value("DATABASE_ERROR"))
        // Internal connection detail must not reach the client
        .andExpect(content().string(not(containsString("10.0.0.1"))))
        .andExpect(content().string(not(containsString("5432"))));
  }

  // ------------------------------------------------------------------
  // 500 — catch-all for unexpected exceptions
  // ------------------------------------------------------------------

  @Test
  @DisplayName("500: unexpected RuntimeException returns INTERNAL_ERROR, no stack trace or message leaked")
  void unexpectedException_returns500() throws Exception {
    when(queryService.process(any())).thenThrow(
        new RuntimeException("internal state: vectorIndex=null offset=-1"));

    mockMvc.perform(post("/api/v1/query")
            .contentType(MediaType.APPLICATION_JSON)
            .content(VALID_BODY))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.status").value(500))
        .andExpect(jsonPath("$.errorCode").value("INTERNAL_ERROR"))
        // The raw exception message must never reach the client
        .andExpect(content().string(not(containsString("vectorIndex"))))
        .andExpect(content().string(not(containsString("RuntimeException"))));
  }

  @Test
  @DisplayName("500: error response has timestamp and message but no stacktrace field")
  void internalError_responseShape_hasNoStacktrace() throws Exception {
    when(queryService.process(any())).thenThrow(new RuntimeException("boom"));

    mockMvc.perform(post("/api/v1/query")
            .contentType(MediaType.APPLICATION_JSON)
            .content(VALID_BODY))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.timestamp").exists())
        .andExpect(jsonPath("$.message").exists())
        .andExpect(jsonPath("$.stackTrace").doesNotExist())
        .andExpect(jsonPath("$.trace").doesNotExist())
        .andExpect(jsonPath("$.path").doesNotExist());
  }
}
