package com.semantic.gateway.service;

import com.semantic.gateway.embedding.OpenAIEmbeddingService;
import com.semantic.gateway.model.QueryRequest;
import com.semantic.gateway.model.QueryResponse;
import com.semantic.gateway.model.RequestLog;
import com.semantic.gateway.repository.SemanticCacheRepository;
import com.semantic.gateway.repository.RequestLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QueryService {
    private static final Logger log = LoggerFactory.getLogger(QueryService.class);

    private final OpenAIEmbeddingService embeddingService;
    private final SemanticCacheRepository repository;
    private final StatsService stats;
    private final SettingsService settingsService;
    private final RequestLogRepository logRepository;

    public QueryService(OpenAIEmbeddingService embeddingService,
                        SemanticCacheRepository repository,
                        StatsService stats,
                        SettingsService settingsService,
                        RequestLogRepository logRepository) {
        this.embeddingService = embeddingService;
        this.repository = repository;
        this.stats = stats;
        this.settingsService = settingsService;
        this.logRepository = logRepository;
    }

    public QueryResponse process(QueryRequest request) {
        long startTime = System.currentTimeMillis();
        String prompt = request.getPrompt();
        List<Double> newEmbedding = embeddingService.generateEmbedding(prompt);
        String vectorStr = formatVector(newEmbedding);

        List<Object[]> results = repository.findTopMatches(vectorStr);
        if (!results.isEmpty()) {
            Object[] best = results.get(0);
            String matchedResponse = (String) best[2];
            double cosineDistance = ((Number) best[3]).doubleValue();
            double similarity = 1.0 - cosineDistance;

            double threshold = settingsService.getSimilarityThreshold();
            if (similarity >= threshold) {
                log.info("cache HIT similarity={}", similarity);
                long duration = System.currentTimeMillis() - startTime;
                logRepository.save(new RequestLog(prompt, matchedResponse, "cache", similarity, duration, 0.0004));
                return new QueryResponse(matchedResponse, "cache", similarity);
            }
            log.info("cache MISS bestSimilarity={} threshold={}", similarity, threshold);
        } else {
            log.info("cache MISS (empty cache)");
        }

        String response = embeddingService.generateResponse("Answer briefly (1-2 lines): " + prompt);
        repository.saveWithVector(prompt, response, vectorStr);
        long duration = System.currentTimeMillis() - startTime;
        logRepository.save(new RequestLog(prompt, response, "llm", null, duration, 0.0));
        return new QueryResponse(response, "llm", null);
    }

    private String formatVector(List<Double> vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(vector.get(i));
        }
        sb.append("]");
        return sb.toString();
    }
}
