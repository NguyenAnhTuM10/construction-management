package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.response.UserResponse;
import com.example.construction_management.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser( ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserResponse user = userService.getCurrentUser(authentication);
        return ResponseEntity.ok(
                ApiResponse.success(user, "Get user info successfully")
        );
    }

}
