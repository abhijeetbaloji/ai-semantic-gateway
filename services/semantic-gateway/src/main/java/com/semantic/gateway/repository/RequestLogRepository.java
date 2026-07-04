package com.semantic.gateway.repository;

import com.semantic.gateway.model.RequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface RequestLogRepository extends JpaRepository<RequestLog, Long> {
    List<RequestLog> findTop100ByOrderByTimestampDesc();

    long countBySource(String source);

    @Query("SELECT COALESCE(SUM(r.estimatedCostSaved), 0.0) FROM RequestLog r")
    double sumEstimatedCostSaved();

    @Query("SELECT r.prompt, COUNT(r) FROM RequestLog r WHERE r.source = 'cache' GROUP BY r.prompt ORDER BY COUNT(r) DESC")
    List<Object[]> findTopCachedPrompts();
}
