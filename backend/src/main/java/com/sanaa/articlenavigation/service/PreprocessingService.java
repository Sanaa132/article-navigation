package com.sanaa.articlenavigation.service;

import org.springframework.stereotype.Service;

@Service
public class PreprocessingService {

    public String process(String query) {

        if (query == null || query.trim().isEmpty()) {
            throw new IllegalArgumentException("Query cannot be empty");
        }

        // 1. Convert to lowercase
        String cleaned = query.toLowerCase();

        // 2. Remove special characters (keep only letters + space)
        //add numbers also
        cleaned = cleaned.replaceAll("[^a-zA-Z ]", "");

        // 3. Remove extra spaces
        cleaned = cleaned.replaceAll("\\s+", " ").trim();

        return cleaned;
    }
}