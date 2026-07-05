package com.semantic.gateway.controller;

import com.semantic.gateway.dto.SuccessResponse;
import com.semantic.gateway.model.RequestLog;
import com.semantic.gateway.repository.RequestLogRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final RequestLogRepository logRepository;
    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.ofPattern("EEE").withZone(ZoneId.systemDefault());

    public AnalyticsController(RequestLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @GetMapping("/logs")
    public SuccessResponse<List<RequestLog>> getLogs() {
        return new SuccessResponse<>(200, logRepository.findTop100ByOrderByTimestampDesc());
    }

    @GetMapping("/top-prompts")
    public SuccessResponse<List<Map<String, Object>>> getTopPrompts() {
        List<Object[]> results = logRepository.findTopCachedPrompts();
        List<Map<String, Object>> response = new ArrayList<>();
        for (int i = 0; i < Math.min(results.size(), 10); i++) {
            Object[] row = results.get(i);
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("prompt", row[0]);
            map.put("hits", row[1]);
            response.add(map);
        }
        return new SuccessResponse<>(200, response);
    }

    @GetMapping("/history")
    public SuccessResponse<List<Map<String, Object>>> getRequestHistory() {
        List<RequestLog> allLogs = logRepository.findAll();
        Map<String, Map<String, Integer>> dayMap = new LinkedHashMap<>();
        
        Instant now = Instant.now();
        for (int i = 6; i >= 0; i--) {
            Instant dayInstant = now.minusSeconds(i * 24 * 3600L);
            String dayStr = DAY_FORMATTER.format(dayInstant);
            Map<String, Integer> stats = new HashMap<>();
            stats.put("hits", 0);
            stats.put("misses", 0);
            dayMap.put(dayStr, stats);
        }

        for (RequestLog r : allLogs) {
            String dayStr = DAY_FORMATTER.format(r.getTimestamp());
            if (dayMap.containsKey(dayStr)) {
                Map<String, Integer> stats = dayMap.get(dayStr);
                if ("cache".equals(r.getSource())) {
                    stats.put("hits", stats.get("hits") + 1);
                } else {
                    stats.put("misses", stats.get("misses") + 1);
                }
            }
        }

        List<Map<String, Object>> chartData = new ArrayList<>();
        for (Map.Entry<String, Map<String, Integer>> entry : dayMap.entrySet()) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("day", entry.getKey());
            map.put("hits", entry.getValue().get("hits"));
            map.put("misses", entry.getValue().get("misses"));
            chartData.add(map);
        }

        return new SuccessResponse<>(200, chartData);
    }

    @GetMapping("/requests-per-hour")
    public SuccessResponse<List<Map<String, Object>>> getRequestsPerHour() {
        List<RequestLog> allLogs = logRepository.findAll();
        Map<String, Integer> hourMap = new LinkedHashMap<>();
        Instant now = Instant.now();
        DateTimeFormatter hourFormatter = DateTimeFormatter.ofPattern("HH:00").withZone(ZoneId.systemDefault());
        
        for (int i = 23; i >= 0; i--) {
            Instant hourInstant = now.minusSeconds(i * 3600L);
            hourMap.put(hourFormatter.format(hourInstant), 0);
        }

        Instant since = now.minusSeconds(24 * 3600L);
        for (RequestLog r : allLogs) {
            if (r.getTimestamp().isAfter(since)) {
                String hourStr = hourFormatter.format(r.getTimestamp());
                if (hourMap.containsKey(hourStr)) {
                    hourMap.put(hourStr, hourMap.get(hourStr) + 1);
                }
            }
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : hourMap.entrySet()) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("hour", entry.getKey());
            map.put("requests", entry.getValue());
            response.add(map);
        }
        return new SuccessResponse<>(200, response);
    }

    @GetMapping("/latency")
    public SuccessResponse<List<Map<String, Object>>> getLatency() {
        List<RequestLog> allLogs = logRepository.findAll();
        Map<String, List<Long>> dayDurations = new LinkedHashMap<>();
        
        Instant now = Instant.now();
        for (int i = 6; i >= 0; i--) {
            Instant dayInstant = now.minusSeconds(i * 24 * 3600L);
            String dayStr = DAY_FORMATTER.format(dayInstant);
            dayDurations.put(dayStr, new ArrayList<>());
        }

        for (RequestLog r : allLogs) {
            String dayStr = DAY_FORMATTER.format(r.getTimestamp());
            if (dayDurations.containsKey(dayStr)) {
                dayDurations.get(dayStr).add(r.getDurationMs());
            }
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Map.Entry<String, List<Long>> entry : dayDurations.entrySet()) {
            List<Long> durations = entry.getValue();
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("day", entry.getKey());
            
            if (durations.isEmpty()) {
                map.put("p50", 0);
                map.put("p95", 0);
                map.put("p99", 0);
            } else {
                Collections.sort(durations);
                int size = durations.size();
                map.put("p50", durations.get(Math.min((int) (size * 0.5), size - 1)));
                map.put("p95", durations.get(Math.min((int) (size * 0.95), size - 1)));
                map.put("p99", durations.get(Math.min((int) (size * 0.99), size - 1)));
            }
            response.add(map);
        }
        return new SuccessResponse<>(200, response);
    }

    @GetMapping("/models")
    public SuccessResponse<List<Map<String, Object>>> getModelDistribution() {
        long cacheHits = logRepository.countBySource("cache");
        long cacheMisses = logRepository.countBySource("llm");
        
        long embedCalls = cacheHits + cacheMisses;
        long completionCalls = cacheMisses;
        long totalCalls = embedCalls + completionCalls;

        List<Map<String, Object>> response = new ArrayList<>();
        if (totalCalls == 0) {
            Map<String, Object> m1 = new LinkedHashMap<>();
            m1.put("name", "gpt-4o-mini");
            m1.put("value", 0);
            m1.put("color", "#3b82f6");
            response.add(m1);

            Map<String, Object> m2 = new LinkedHashMap<>();
            m2.put("name", "text-embedding-3-small");
            m2.put("value", 0);
            m2.put("color", "#8b5cf6");
            response.add(m2);
            return new SuccessResponse<>(200, response);
        }

        double embedShare = ((double) embedCalls / totalCalls) * 100;
        double completionShare = ((double) completionCalls / totalCalls) * 100;

        Map<String, Object> m1 = new LinkedHashMap<>();
        m1.put("name", "gpt-4o-mini");
        m1.put("value", Math.round(completionShare));
        m1.put("color", "#3b82f6");
        response.add(m1);

        Map<String, Object> m2 = new LinkedHashMap<>();
        m2.put("name", "text-embedding-3-small");
        m2.put("value", Math.round(embedShare));
        m2.put("color", "#8b5cf6");
        response.add(m2);

        return new SuccessResponse<>(200, response);
    }
}
