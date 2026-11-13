package com.nexadesk.backend.repository;

import com.nexadesk.backend.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Integer> {

    List<Ticket> findByCreatedByOrAssignedTo(Integer createdBy, Integer assignedTo);

    Optional<Ticket> findByIdAndCreatedByOrIdAndAssignedTo(
            Integer firstId,
            Integer createdBy,
            Integer secondId,
            Integer assignedTo
    );

    List<Ticket> findByAssignedTo(Integer assignedTo);
}