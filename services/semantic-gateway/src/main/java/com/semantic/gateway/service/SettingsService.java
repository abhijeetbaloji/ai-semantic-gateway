package com.semantic.gateway.service;

import com.semantic.gateway.model.SystemSettings;
import com.semantic.gateway.repository.SystemSettingsRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsService {
    private static final Logger log = LoggerFactory.getLogger(SettingsService.class);

    private final SystemSettingsRepository repository;

    @Value("${openai.mock:true}")
    private boolean defaultMockMode;

    @Value("${semantic.cache.threshold:0.90}")
    private double defaultSimilarityThreshold;

    @Value("${semantic.cache.prompt.max-length:8000}")
    private int defaultMaxPromptLength;

    private SystemSettings cachedSettings;

    public SettingsService(SystemSettingsRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    @Transactional
    public synchronized void init() {
        try {
            cachedSettings = repository.findById(1L).orElseGet(() -> {
                log.info("System settings not found in database. Initializing with default config...");
                SystemSettings settings = new SystemSettings(defaultSimilarityThreshold, defaultMaxPromptLength, defaultMockMode);
                return repository.save(settings);
            });
            log.info("Loaded system settings: mockMode={}, threshold={}, maxLen={}",
                    cachedSettings.isMockMode(), cachedSettings.getSimilarityThreshold(), cachedSettings.getMaxPromptLength());
        } catch (Exception e) {
            log.error("Failed to load settings from database, using properties fallback", e);
            cachedSettings = new SystemSettings(defaultSimilarityThreshold, defaultMaxPromptLength, defaultMockMode);
        }
    }

    public synchronized SystemSettings getSettings() {
        return cachedSettings;
    }

    public synchronized double getSimilarityThreshold() {
        return cachedSettings.getSimilarityThreshold();
    }

    public synchronized int getMaxPromptLength() {
        return cachedSettings.getMaxPromptLength();
    }

    public synchronized boolean isMockMode() {
        return cachedSettings.isMockMode();
    }

    @Transactional
    public synchronized SystemSettings updateSettings(SystemSettings newSettings) {
        cachedSettings.setSimilarityThreshold(newSettings.getSimilarityThreshold());
        cachedSettings.setMaxPromptLength(newSettings.getMaxPromptLength());
        cachedSettings.setMockMode(newSettings.isMockMode());
        SystemSettings saved = repository.save(cachedSettings);
        log.info("Updated system settings: mockMode={}, threshold={}, maxLen={}",
                saved.isMockMode(), saved.getSimilarityThreshold(), saved.getMaxPromptLength());
        return saved;
    }
}
