package com.datapeice.slbackend.dto;

import lombok.Data;
import java.util.List;

@Data
public class MyApplicationsResponse {
    /** The newest application (latest by createdAt), or null if none. */
    private ApplicationResponse current;
    /** All applications sorted newest → oldest. */
    private List<ApplicationResponse> history;
}

