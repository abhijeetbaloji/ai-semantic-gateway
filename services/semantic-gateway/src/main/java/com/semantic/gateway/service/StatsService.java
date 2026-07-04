package com.semantic.gateway.service;

import com.semantic.gateway.repository.RequestLogRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;

@Service
public class StatsService {
    private final RequestLogRepository logRepository;
    private final Instant startedAt = Instant.now();

    public StatsService(RequestLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    public void recordHit() {}
    public void recordMiss() {}

    public long getRequestCount() {
        return logRepository.count();
    }

    public long getCacheHits() {
        return logRepository.countBySource("cache");
    }

    public long getCacheMisses() {
        return logRepository.countBySource("llm");
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public double getHitRate() {
        long total = getRequestCount();
        return total == 0 ? 0.0 : (double) getCacheHits() / total;
    }

    public double getEstimatedCostSavedUsd() {
        return logRepository.sumEstimatedCostSaved();
    }
}
