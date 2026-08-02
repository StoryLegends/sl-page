package com.datapeice.slbackend.dto;

import com.datapeice.slbackend.entity.KnownModStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KnownModRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Status is required")
    private KnownModStatus status;

    private String notes;
}
