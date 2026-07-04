package com.semantic.gateway.model;
import com.semantic.gateway.validation.MaxPromptLength;
import jakarta.validation.constraints.NotBlank;
public class QueryRequest {
    @NotBlank(message = "prompt is required and cannot be blank")
    @MaxPromptLength
    private String prompt;
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
}
