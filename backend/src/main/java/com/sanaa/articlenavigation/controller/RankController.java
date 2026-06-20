package com.sanaa.articlenavigation.controller;

import com.sanaa.articlenavigation.model.RankRequest;
import com.sanaa.articlenavigation.model.RankResponse;
import com.sanaa.articlenavigation.service.RankService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // allow extension + browser calls (should change later)
public class RankController {

    @Autowired
    private RankService rankService;

    @PostMapping("/rank")
    public ResponseEntity<?> rank(@RequestBody RankRequest request) {

        try {
            RankResponse response = rankService.rank(request);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            // Bad input
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            // Unexpected failure
            return ResponseEntity.status(500).body("Internal server error");
        }
    }
}