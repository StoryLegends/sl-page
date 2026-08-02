package com.datapeice.slbackend.dto.custompage;

public class CreateCustomPageRequest {
    private String path;
    private String title;
    private String htmlContent;

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getHtmlContent() { return htmlContent; }
    public void setHtmlContent(String htmlContent) { this.htmlContent = htmlContent; }
}
