package com.semantic.gateway.model;

import jakarta.persistence.*;

@Entity
@Table(name = "system_settings")
public class SystemSettings {
    @Id
    private Long id = 1L; // single row configuration

    @Column(name = "similarity_threshold", nullable = false)
    private double similarityThreshold = 0.90;

    @Column(name = "max_prompt_length", nullable = false)
    private int maxPromptLength = 8000;

    @Column(name = "mock_mode", nullable = false)
    private boolean mockMode = true;

    public SystemSettings() {}

    public SystemSettings(double similarityThreshold, int maxPromptLength, boolean mockMode) {
        this.similarityThreshold = similarityThreshold;
        this.maxPromptLength = maxPromptLength;
        this.mockMode = mockMode;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getSimilarityThreshold() { return similarityThreshold; }
    public void setSimilarityThreshold(double similarityThreshold) { this.similarityThreshold = similarityThreshold; }

    public int getMaxPromptLength() { return maxPromptLength; }
    public void setMaxPromptLength(int maxPromptLength) { this.maxPromptLength = maxPromptLength; }

    public boolean isMockMode() { return mockMode; }
    public void setMockMode(boolean mockMode) { this.mockMode = mockMode; }
}
