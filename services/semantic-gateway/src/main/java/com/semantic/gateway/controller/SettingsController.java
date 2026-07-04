package com.semantic.gateway.controller;

import com.semantic.gateway.dto.SuccessResponse;
import com.semantic.gateway.model.SystemSettings;
import com.semantic.gateway.service.SettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public SuccessResponse<SystemSettings> getSettings() {
        return new SuccessResponse<>(200, settingsService.getSettings());
    }

    @PostMapping
    public SuccessResponse<SystemSettings> updateSettings(@RequestBody SystemSettings newSettings) {
        return new SuccessResponse<>(200, settingsService.updateSettings(newSettings));
    }
}
