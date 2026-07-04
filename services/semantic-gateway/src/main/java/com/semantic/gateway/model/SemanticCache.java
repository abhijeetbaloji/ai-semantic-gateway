package com.semantic.gateway.model;
import jakarta.persistence.*;
@Entity
@Table(name = "semantic_cache")
public class SemanticCache {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String prompt;
    private String response;
    public SemanticCache() {}
    public SemanticCache(String prompt, String response) { this.prompt = prompt; this.response = response; }
    public Long getId() { return id; }
    public String getPrompt() { return prompt; }
    public void setPrompt(String p) { this.prompt = p; }
    public String getResponse() { return response; }
    public void setResponse(String r) { this.response = r; }
}
