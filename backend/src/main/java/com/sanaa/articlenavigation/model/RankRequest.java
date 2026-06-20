package com.sanaa.articlenavigation.model;

import java.util.List;

public class RankRequest {

    private String query;
    private List<String> paragraphs;

    // Default constructor (REQUIRED for Jackson library (JSON -> Java Object)
    public RankRequest() {}

    // Getters
    public String getQuery() {
        return query;
    }

    public List<String> getParagraphs() {
        return paragraphs;
    }

    // Setters
    public void setQuery(String query) {
        this.query = query;
    }

    public void setParagraphs(List<String> paragraphs) {
        this.paragraphs = paragraphs;
    }
}