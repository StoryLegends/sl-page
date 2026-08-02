package com.datapeice.slbackend.dto;

import lombok.Data;

@Data
public class ApplicationBody {
    private String realName;
    private Integer age;
    private String whyUs;
    private String source;
    private String plans;
    private boolean contentCreator;
    private String channelLink;
    private String additionalInfo;
    private Integer selfRating;
    private String adequacyDefinition;
}