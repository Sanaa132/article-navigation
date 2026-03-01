package com.sanaa.articlenavigation.service;

import com.sanaa.articlenavigation.model.RankRequest;
import com.sanaa.articlenavigation.model.RankResponse;
import com.sanaa.articlenavigation.util.TextProcessor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RankService {

    public List<RankResponse> processArticle(RankRequest request) {

        if (request.getArticle() == null || request.getArticle().isBlank()) {
            return List.of();
        }

        List<String> paragraphs = TextProcessor.splitIntoParagraphs(request.getArticle());

        /*List<String> cleanedParagraphs= paragraphs.stream()
                .map(TextProcessor::normalize)
                .toList(); */

        if (request.getQuery() == null || request.getQuery().isBlank()) {
            return List.of();
        }
        List<String> queryTokens= TextProcessor.tokenize((request.getQuery()));

        List<RankResponse> responses=new ArrayList<>();

        for(int i=0;i<paragraphs.size();i++){
            String para= paragraphs.get(i);
            List<String> paraTokens = TextProcessor.tokenize(para);
            long count = queryTokens.stream()
                    .filter(paraTokens::contains)
                    .count();

            double score= queryTokens.isEmpty() ? 0.0: (double) count/queryTokens.size();
            responses.add(new RankResponse(i,score));
        }

        responses = responses.stream()
                .filter(r -> r.getScore() > 0)
                .toList();

        responses = responses.stream()
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(5)
                .toList();

        return responses;

    }
}
