package com.semantic.gateway.controller;

import com.semantic.gateway.service.StatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * /health and /metrics endpoints. Minimal by design — Prometheus and
 * proper observability come later. This is enough to (a) prove the
 * service is up, and (b) power the dashboard's real numbers.
 */
@RestController
@RequestMapping("/api/v1")
public class SystemController {

    private final StatsService stats;

    public SystemController(StatsService stats) {
        this.stats = stats;
    }

    @GetMapping({"/health", "/status"})
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("version", "0.1.0-mvp");
        body.put("uptimeSeconds", Duration.between(stats.getStartedAt(), Instant.now()).toSeconds());
        return body;
    }

    @GetMapping({"/metrics", "/stats"})
    public Map<String, Object> metrics() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("requestCount", stats.getRequestCount());
        body.put("cacheHits", stats.getCacheHits());
        body.put("cacheMisses", stats.getCacheMisses());
        body.put("hitRate", stats.getHitRate());
        body.put("estimatedCostSavedUsd", stats.getEstimatedCostSavedUsd());
        body.put("uptimeSeconds", Duration.between(stats.getStartedAt(), Instant.now()).toSeconds());
        return body;
    }
}
