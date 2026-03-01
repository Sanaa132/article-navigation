package com.sanaa.articlenavigation.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RankResponse {
    private int index;
    private double score;
}
