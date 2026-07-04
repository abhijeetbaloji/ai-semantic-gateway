package com.semantic.gateway.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "request_log")
public class RequestLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String response;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private String source; // "cache" or "llm"

    private Double similarity;

    @Column(name = "duration_ms", nullable = false)
    private long durationMs;

    @Column(name = "estimated_cost_saved", nullable = false)
    private double estimatedCostSaved;

    public RequestLog() {}

    public RequestLog(String prompt, String response, String source, Double similarity, long durationMs, double estimatedCostSaved) {
        this.prompt = prompt;
        this.response = response;
        this.timestamp = Instant.now();
        this.source = source;
        this.similarity = similarity;
        this.durationMs = durationMs;
        this.estimatedCostSaved = estimatedCostSaved;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Double getSimilarity() { return similarity; }
    public void setSimilarity(Double similarity) { this.similarity = similarity; }

    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }

    public double getEstimatedCostSaved() { return estimatedCostSaved; }
    public void setEstimatedCostSaved(double estimatedCostSaved) { this.estimatedCostSaved = estimatedCostSaved; }
}
