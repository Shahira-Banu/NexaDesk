
package com.nexadesk.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EmployeePasswordResetRequest {

    @NotBlank(message = "New password is required")
    @Size(min = 12, max = 72, message = "Password must be between 12 and 72 characters")
    private String newPassword;

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
