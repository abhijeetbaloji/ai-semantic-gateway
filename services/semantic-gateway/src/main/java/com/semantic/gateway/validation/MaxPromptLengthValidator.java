package com.semantic.gateway.validation;

import com.semantic.gateway.service.SettingsService;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MaxPromptLengthValidator implements ConstraintValidator<MaxPromptLength, String> {

    @Autowired
    private SettingsService settingsService;

    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null) return true;
        int max = (settingsService != null) ? settingsService.getMaxPromptLength() : 8000;
        return value.length() <= max;
    }
}
