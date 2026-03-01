package com.sanaa.articlenavigation.util;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

public class TextProcessor {

    public static List<String> splitIntoParagraphs(String article) {
        return Arrays.stream((article.split("\\n\\n+")))
                .map(String::trim)
                .filter(p -> !p.isEmpty())
                .toList();
    }

    public static String normalize(String text) {
        return text.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .trim();
    }

    private static final Set<String> STOP_WORDS = Set.of("for", "in", "a", "an", "the", "is", "and", "to", "of", "on", "with"
    );

    public static List<String> tokenize(String text) {
        String normalized=normalize(text);
        return Arrays.stream(normalized.split("\\s+"))
                .filter(word -> !STOP_WORDS.contains(word))
                .toList();
    }

}
