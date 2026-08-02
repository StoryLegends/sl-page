package com.datapeice.slbackend.service;

import com.datapeice.slbackend.dto.custompage.CreateCustomPageRequest;
import com.datapeice.slbackend.dto.custompage.CustomPageDto;
import com.datapeice.slbackend.entity.CustomPage;
import com.datapeice.slbackend.repository.CustomPageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomPageService {

    private final CustomPageRepository customPageRepository;

    public CustomPageService(CustomPageRepository customPageRepository) {
        this.customPageRepository = customPageRepository;
    }

    public List<CustomPageDto> getAllPages() {
        return customPageRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public CustomPageDto getPageByPath(String path) {
        return customPageRepository.findByPath(path)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Page not found with path: " + path));
    }

    public CustomPageDto getPageById(Long id) {
        return customPageRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Page not found with id: " + id));
    }

    @Transactional
    public CustomPageDto createPage(CreateCustomPageRequest request) {
        if (customPageRepository.findByPath(request.getPath()).isPresent()) {
            throw new RuntimeException("Page with path " + request.getPath() + " already exists");
        }
        
        CustomPage page = new CustomPage();
        page.setPath(request.getPath());
        page.setTitle(request.getTitle());
        page.setHtmlContent(request.getHtmlContent());
        
        CustomPage savedPage = customPageRepository.save(page);
        return mapToDto(savedPage);
    }

    @Transactional
    public CustomPageDto updatePage(Long id, CreateCustomPageRequest request) {
        CustomPage page = customPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Page not found with id: " + id));
                
        // Check if path is taken by another page
        customPageRepository.findByPath(request.getPath())
                .ifPresent(existingPage -> {
                    if (!existingPage.getId().equals(id)) {
                        throw new RuntimeException("Page with path " + request.getPath() + " already exists");
                    }
                });
                
        page.setPath(request.getPath());
        page.setTitle(request.getTitle());
        page.setHtmlContent(request.getHtmlContent());
        
        return mapToDto(customPageRepository.save(page));
    }

    @Transactional
    public void deletePage(Long id) {
        if (!customPageRepository.existsById(id)) {
            throw new RuntimeException("Page not found with id: " + id);
        }
        customPageRepository.deleteById(id);
    }

    private CustomPageDto mapToDto(CustomPage page) {
        CustomPageDto dto = new CustomPageDto();
        dto.setId(page.getId());
        dto.setPath(page.getPath());
        dto.setTitle(page.getTitle());
        dto.setHtmlContent(page.getHtmlContent());
        return dto;
    }
}
