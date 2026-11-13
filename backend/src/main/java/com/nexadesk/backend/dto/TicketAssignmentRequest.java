package com.nexadesk.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class TicketAssignmentRequest {

    @NotNull(message = "Assigned employee ID is required")
    @Positive(message = "Assigned employee ID must be positive")
    private Integer assignedTo;

    public Integer getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Integer assignedTo) {
        this.assignedTo = assignedTo;
    }
}
