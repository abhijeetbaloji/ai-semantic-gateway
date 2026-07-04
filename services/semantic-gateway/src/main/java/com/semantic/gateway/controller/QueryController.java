package com.semantic.gateway.controller;
import com.semantic.gateway.dto.SuccessResponse;
import com.semantic.gateway.model.QueryRequest;
import com.semantic.gateway.model.QueryResponse;
import com.semantic.gateway.service.QueryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/v1")
public class QueryController {
    private final QueryService queryService;
    public QueryController(QueryService queryService) { this.queryService = queryService; }
    @PostMapping("/query")
    public SuccessResponse<QueryResponse> query(@Valid @RequestBody QueryRequest request) {
        QueryResponse response = queryService.process(request);
        return new SuccessResponse<>(HttpStatus.OK.value(), response);
    }
    @GetMapping("/")
    public String home() { return "Semantic Gateway is running"; }
}
