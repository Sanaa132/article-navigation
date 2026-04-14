package com.sanaa.articlenavigation.service;

import com.sanaa.articlenavigation.model.RankRequest;
import com.sanaa.articlenavigation.model.RankResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RankService {

    @Autowired
    private PreprocessingService preprocessingService;

    @Autowired
    private PythonClient pythonClient;

    public RankResponse rank(RankRequest request) {

        // 1. Validate input (don’t skip this)
        if (request == null || request.getQuery() == null || request.getParagraphs() == null) {
            throw new IllegalArgumentException("Invalid request data");
        }

        if (request.getParagraphs().isEmpty()) {
            return new RankResponse(List.of());
        }

        // 2. Preprocess query (basic cleaning only)
        String processedQuery = preprocessingService.process(request.getQuery());

        // 3. Call Python NLP engine
        List<Integer> rankedIndices = pythonClient.getRankedParagraphs(
                processedQuery,
                request.getParagraphs()
        );

        // 4. Safety fallback (important)
        if (rankedIndices == null || rankedIndices.isEmpty()) {
            // fallback: return original order
            rankedIndices = java.util.stream.IntStream
                    .range(0, request.getParagraphs().size())
                    .boxed()
                    .toList();
        }

        // 5. Return response
        return new RankResponse(rankedIndices);
    }
}