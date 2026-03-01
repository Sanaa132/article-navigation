package com.sanaa.articlenavigation.controller;

import com.sanaa.articlenavigation.model.RankRequest;
import com.sanaa.articlenavigation.model.RankResponse;
import com.sanaa.articlenavigation.service.RankService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api")
public class RankController {

    @Autowired
    RankService rankservice;

    @PostMapping("/rank")
    public List<RankResponse> rank(@RequestBody RankRequest request){
        return rankservice.processArticle(request);
    }

}
