package com.example.construction_management.service;

import com.example.construction_management.dto.request.*;
import com.example.construction_management.dto.response.TaskResponse;
import com.example.construction_management.dto.response.TaskSummaryResponse;
import com.example.construction_management.entity.*;
import com.example.construction_management.enums.TaskPriority;
import com.example.construction_management.enums.TaskStatus;
import com.example.construction_management.exception.BusinessException;
import com.example.construction_management.exception.ErrorCode;
import com.example.construction_management.mapper.TaskMapper;
import com.example.construction_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;

    public List<TaskSummaryResponse> getAllTasks() {
        return taskMapper.toSummaryResponseList(taskRepository.findAll());
    }

    public TaskResponse getTaskById(Long id) {
        Task task = findTaskById(id);
        return taskMapper.toResponse(task);
    }

    public List<TaskSummaryResponse> getTasksByEmployee(Long employeeId) {
        return taskMapper.toSummaryResponseList(
                taskRepository.findByAssignedToId(employeeId)
        );
    }

    public List<TaskSummaryResponse> getTasksByStatus(String status) {
        TaskStatus taskStatus = TaskStatus.valueOf(status);
        return taskMapper.toSummaryResponseList(
                taskRepository.findByStatus(taskStatus)
        );
    }

    public List<TaskSummaryResponse> getMyTasks() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = findUserByUsername(username);

        if (user.getEmployee() == null) {
            throw new IllegalStateException("User không có thông tin nhân viên");
        }

        return taskMapper.toSummaryResponseList(
                taskRepository.findByAssignedToId(user.getEmployee().getId())
        );
    }

    public List<TaskSummaryResponse> getMyTasksByStatus(String status) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = findUserByUsername(username);

        if (user.getEmployee() == null) {
            throw new IllegalStateException("User không có thông tin nhân viên");
        }

        TaskStatus taskStatus = TaskStatus.valueOf(status);
        return taskMapper.toSummaryResponseList(
                taskRepository.findByAssignedToIdAndStatus(user.getEmployee().getId(), taskStatus)
        );
    }

    public List<TaskSummaryResponse> getOverdueTasks() {
        return taskMapper.toSummaryResponseList(
                taskRepository.findOverdueTasks(LocalDateTime.now())
        );
    }

    public List<TaskSummaryResponse> getUpcomingTasks() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeDaysLater = now.plusDays(3);
        return taskMapper.toSummaryResponseList(
                taskRepository.findUpcomingTasks(now, threeDaysLater)
        );
    }

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        // Validate employee exists
        Employee employee = findEmployeeById(request.getAssignedTo());

        // Get current user (Admin)
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = findUserByUsername(username);

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .assignedTo(employee)
                .assignedBy(admin)
                .priority(TaskPriority.valueOf(request.getPriority()))
                .deadline(request.getDeadline())
                .status(TaskStatus.TODO)
                .build();

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        Task task = findTaskById(id);

        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getAssignedTo() != null) {
            Employee employee = findEmployeeById(request.getAssignedTo());
            task.setAssignedTo(employee);
        }
        if (request.getPriority() != null) {
            task.setPriority(TaskPriority.valueOf(request.getPriority()));
        }
        if (request.getDeadline() != null) {
            task.setDeadline(request.getDeadline());
        }

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, TaskStatusUpdateRequest request) {
        Task task = findTaskById(id);
        TaskStatus newStatus = TaskStatus.valueOf(request.getStatus());

        task.setStatus(newStatus);

        // Tự động set completedDate khi hoàn thành
        if (newStatus == TaskStatus.COMPLETED && task.getCompletedDate() == null) {
            task.setCompletedDate(LocalDateTime.now());
        }

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse submitTaskResult(Long id, TaskResultRequest request) {
        Task task = findTaskById(id);

        // Kiểm tra nhân viên có được giao task này không
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = findUserByUsername(username);

        if (user.getEmployee() == null ||
                !user.getEmployee().getId().equals(task.getAssignedTo().getId())) {
            throw new IllegalStateException("Bạn không có quyền nộp kết quả cho task này");
        }

        task.setResult(request.getResult());
        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedDate(LocalDateTime.now());

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.TASK_NOT_EXITS);
        }
        taskRepository.deleteById(id);
    }

    // Helper methods
    private Task findTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() ->new BusinessException(ErrorCode.TASK_NOT_EXITS));
    }

    private Employee findEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.TASK_NOT_EXITS));
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.TASK_NOT_EXITS));
    }
}