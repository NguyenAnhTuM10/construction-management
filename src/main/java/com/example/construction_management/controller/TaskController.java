package com.example.construction_management.controller;

import com.example.construction_management.dto.ApiResponse;
import com.example.construction_management.dto.request.*;

import com.example.construction_management.dto.response.TaskResponse;
import com.example.construction_management.dto.response.TaskSummaryResponse;
import com.example.construction_management.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@Tag(name = "Task Management", description = "Endpoints for managing employee tasks")
public class TaskController {
    private final TaskService taskService;

    // ========== ADMIN ENDPOINTS ==========

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all tasks (Admin only)")
    public ResponseEntity<ApiResponse<List<TaskSummaryResponse>>> getAllTasks() {
        return ResponseEntity.ok(ApiResponse.success(taskService.getAllTasks()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get task by ID")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskById(id)));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get tasks by employee (Admin only)")
    public ResponseEntity<ApiResponse<List<TaskSummaryResponse>>> getTasksByEmployee(
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByEmployee(employeeId)));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get tasks by status (Admin only)")
    public ResponseEntity<ApiResponse<List<TaskSummaryResponse>>> getTasksByStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByStatus(status)));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get overdue tasks (Admin only)")
    public ResponseEntity<ApiResponse<List<TaskSummaryResponse>>> getOverdueTasks() {
        return ResponseEntity.ok(ApiResponse.success(taskService.getOverdueTasks()));
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get upcoming tasks (deadline within 3 days) (Admin only)")
    public ResponseEntity<ApiResponse<List<TaskSummaryResponse>>> getUpcomingTasks() {
        return ResponseEntity.ok(ApiResponse.success(taskService.getUpcomingTasks()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new task (Admin only)")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(taskService.createTask(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update task (Admin only)")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(taskService.updateTask(id, request)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update task status (Admin only)")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody TaskStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(taskService.updateTaskStatus(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete task (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ========== EMPLOYEE ENDPOINTS ==========

    @GetMapping("/my-tasks")
    @Operation(summary = "Get my assigned tasks")
    public ResponseEntity<ApiResponse<List<TaskSummaryResponse>>> getMyTasks() {
        return ResponseEntity.ok(ApiResponse.success(taskService.getMyTasks()));
    }

    @GetMapping("/my-tasks/status/{status}")
    @Operation(summary = "Get my tasks by status")
    public ResponseEntity<ApiResponse<List<TaskSummaryResponse>>> getMyTasksByStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getMyTasksByStatus(status)));
    }

    @PostMapping("/{id}/submit-result")
    @Operation(summary = "Submit task result (Employee)")
    public ResponseEntity<ApiResponse<TaskResponse>> submitTaskResult(
            @PathVariable Long id,
            @Valid @RequestBody TaskResultRequest request) {
        return ResponseEntity.ok(ApiResponse.success(taskService.submitTaskResult(id, request)));
    }
}
