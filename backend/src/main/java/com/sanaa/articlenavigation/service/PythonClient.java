package com.sanaa.articlenavigation.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;

@Service
public class PythonClient {

    private final RestTemplate restTemplate;

    public PythonClient() {
        this.restTemplate = new RestTemplate();
    }

    public List<Integer> getRankedParagraphs(String query, List<String> paragraphs) {

        String url = "http://localhost:8000/rank";

        // 1. Prepare request body
        Map<String, Object> body = new HashMap<>();
        body.put("query", query);
        body.put("paragraphs", paragraphs);

        // 2. Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            // 3. Call Python API
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            // 4. Extract response
            Map responseBody = response.getBody();

            if (responseBody == null || !responseBody.containsKey("ranked_indices")) {
                return Collections.emptyList();
            }

            List<?> rawList = (List<?>) responseBody.get("ranked_indices");

            // 5. Convert safely to Integer list
            List<Integer> result = new ArrayList<>();
            for (Object obj : rawList) {
                result.add(((Number) obj).intValue());
            }

            return result;

        } catch (Exception e) {
            // 6. Log error (important for debugging)
            System.out.println("Error calling Python service: " + e.getMessage());
            return Collections.emptyList();
        }
    }
}