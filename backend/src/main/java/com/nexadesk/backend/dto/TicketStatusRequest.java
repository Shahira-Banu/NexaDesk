package com.nexadesk.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class TicketStatusRequest {

    @NotBlank(message = "Status is required")
    @Pattern(
        regexp = "OPEN|IN_PROGRESS|CLOSED",
        message = "Status must be OPEN, IN_PROGRESS, or CLOSED"
    )
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}