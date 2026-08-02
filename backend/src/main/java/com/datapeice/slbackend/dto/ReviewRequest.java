package com.datapeice.slbackend.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private int rating;
    private String content;
}
