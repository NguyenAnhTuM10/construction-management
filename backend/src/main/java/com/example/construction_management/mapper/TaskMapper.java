package com.example.construction_management.mapper;

import com.example.construction_management.dto.response.TaskResponse;
import com.example.construction_management.dto.response.TaskSummaryResponse;
import com.example.construction_management.entity.Task;
import com.example.construction_management.enums.TaskStatus;
import org.mapstruct.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "assignedToId", source = "assignedTo.id")
    @Mapping(target = "assignedToName", source = "assignedTo.name")
    @Mapping(target = "assignedToDepartment", source = "assignedTo.department.name")
    @Mapping(target = "assignedById", source = "assignedBy.id")
    @Mapping(target = "assignedByUsername", source = "assignedBy.username")
    @Mapping(target = "progress", source = "progress")  // ✅ THÊM DÒNG NÀY
    @Mapping(target = "isOverdue", expression = "java(isOverdue(task))")
    @Mapping(target = "daysUntilDeadline", expression = "java(calculateDaysUntilDeadline(task))")
    TaskResponse toResponse(Task task);

    List<TaskResponse> toResponseList(List<Task> tasks);

    @Mapping(target = "assignedToName", source = "assignedTo.name")
    @Mapping(target = "isOverdue", expression = "java(isOverdue(task))")
    TaskSummaryResponse toSummaryResponse(Task task);

    List<TaskSummaryResponse> toSummaryResponseList(List<Task> tasks);

    default Boolean isOverdue(Task task) {
        if (task.getStatus() == TaskStatus.COMPLETED ||
                task.getStatus() == TaskStatus.CANCELLED) {
            return false;
        }
        return task.getDeadline().isBefore(LocalDateTime.now());
    }

    default Long calculateDaysUntilDeadline(Task task) {
        return ChronoUnit.DAYS.between(LocalDateTime.now(), task.getDeadline());
    }
}