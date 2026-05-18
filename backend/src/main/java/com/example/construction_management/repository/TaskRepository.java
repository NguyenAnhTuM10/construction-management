package com.example.construction_management.repository;

import com.example.construction_management.entity.Task;
import com.example.construction_management.enums.TaskPriority;
import com.example.construction_management.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // List các task của nhân viên theo id
    List<Task> findByAssignedToId(Long id);

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByPriority(TaskPriority priority);


    // Tìm task quá hạn
    @Query("SELECT t FROM Task t WHERE t.deadline < :now AND t.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<Task> findOverdueTasks(LocalDateTime now);

    // Tìm task sắp đến hạn (trong 3 ngày)
    @Query("SELECT t FROM Task t WHERE t.deadline BETWEEN :now AND :threeDaysLater AND t.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<Task> findUpcomingTasks(LocalDateTime now, LocalDateTime threeDaysLater);


    // Tìm task của nhân viên theo trạng thái
    List<Task> findByAssignedToIdAndStatus(Long employeeId, TaskStatus status);

    // Đếm số task theo trạng thái
    long countByStatus(TaskStatus status);

    // Đếm số task của nhân viên
    long countByAssignedToId(Long employeeId);

}
