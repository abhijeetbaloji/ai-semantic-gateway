package com.semantic.gateway.embedding;

import com.semantic.gateway.service.SettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Talks to OpenAI (embeddings + chat) — OR runs in mock mode when
 * openai.mock=true. Mock mode returns deterministic embeddings derived
 * from the prompt text (character-histogram based), so semantically-similar
 * prompts produce numerically-similar vectors and the cache-hit demo
 * still works end-to-end without a real API key.
 *
 * Timeout on both endpoints (see ISSUE-001 in docs/RISK_REGISTER.md).
 * Duration is small enough for interactive demo, generous enough for
 * cold-start OpenAI calls.
 */
@Service
public class OpenAIEmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(OpenAIEmbeddingService.class);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(30);
    private static final int MOCK_EMBEDDING_DIM = 1536;

    private final WebClient webClient;
    private final SettingsService settingsService;

    @Value("${openai.api.key:}")
    private String apiKey;

    public OpenAIEmbeddingService(WebClient.Builder builder, SettingsService settingsService) {
        this.webClient = builder.baseUrl("https://api.openai.com").build();
        this.settingsService = settingsService;
    }

    // ---------------- Embeddings ----------------

    @SuppressWarnings("unchecked")
    public List<Double> generateEmbedding(String text) {
        if (settingsService.isMockMode()) {
            log.debug("Mock embedding for prompt (len={})", text.length());
            return mockEmbedding(text);
        }

        Map<String, Object> request = Map.of(
                "input", text,
                "model", "text-embedding-3-small");

        Map<?, ?> response = webClient.post()
                .uri("/v1/embeddings")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(REQUEST_TIMEOUT)
                .block();

        List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
        return (List<Double>) data.get(0).get("embedding");
    }

    // ---------------- Chat completion ----------------

    @SuppressWarnings("unchecked")
    public String generateResponse(String prompt) {
        if (settingsService.isMockMode()) {
            log.debug("Mock LLM response for prompt (len={})", prompt.length());
            return mockChatResponse(prompt);
        }

        Map<String, Object> request = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(Map.of("role", "user", "content", prompt)));

        Map<?, ?> response = webClient.post()
                .uri("/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(REQUEST_TIMEOUT)
                .block();

        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }

    // ---------------- Mock helpers ----------------

    /**
     * Deterministic character-histogram embedding.
     *
     * The vector is normalized so cosine similarity works meaningfully:
     * identical prompts -> similarity 1.0, prompts with heavily overlapping
     * character distributions (e.g. "reset my password" vs "how to reset password")
     * -> high similarity, unrelated prompts -> low similarity.
     *
     * This is NOT a real semantic embedding, but it's good enough for a
     * demo to show cache-hit behavior on paraphrased prompts.
     */
    static List<Double> mockEmbedding(String text) {
        double[] vec = new double[MOCK_EMBEDDING_DIM];
        String normalized = text.toLowerCase(Locale.ROOT).trim();
        // spread character contributions across the vector deterministically
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            int slot = ((c * 131) + i) & (MOCK_EMBEDDING_DIM - 1);
            vec[slot] += 1.0;
            // also contribute to a second slot based purely on char, so
            // character frequency dominates over position and paraphrases
            // land close in vector space
            int freqSlot = (c * 977) & (MOCK_EMBEDDING_DIM - 1);
            vec[freqSlot] += 2.5;
        }

        // L2 normalize
        double norm = 0.0;
        for (double v : vec) norm += v * v;
        norm = Math.sqrt(norm);
        if (norm == 0.0) norm = 1.0;

        List<Double> out = new ArrayList<>(MOCK_EMBEDDING_DIM);
        for (double v : vec) out.add(v / norm);
        return out;
    }

    /**
     * Deterministic mock chat response. Uses the first few words of the
     * prompt so the demo shows real prompt-response mapping. The interview
     * script can be: "ask a question, get a mock answer, ask a paraphrase,
     * see it come back from cache instantly with a similarity score."
     */
    static String mockChatResponse(String prompt) {
        String cleaned = prompt.replaceFirst("(?i)^answer briefly[^:]*:\\s*", "");
        return "[MOCK MODE] Simulated answer to: \""
                + (cleaned.length() > 80 ? cleaned.substring(0, 77) + "..." : cleaned)
                + "\". In production this would be a real GPT-4o-mini response.";
    }
}
