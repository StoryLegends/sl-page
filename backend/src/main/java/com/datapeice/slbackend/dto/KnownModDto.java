package com.datapeice.slbackend.dto;

import com.datapeice.slbackend.entity.KnownModStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KnownModDto {
    private Long id;
    private String name;
    private KnownModStatus status;
    private String addedBy;
    private String notes;
    private LocalDateTime createdAt;
}
