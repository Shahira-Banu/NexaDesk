package com.nexadesk.backend.controller;

import com.nexadesk.backend.dto.TicketAssignmentRequest;
import com.nexadesk.backend.dto.TicketRequest;
import com.nexadesk.backend.dto.TicketStatusRequest;
import com.nexadesk.backend.entity.Ticket;
import com.nexadesk.backend.entity.User;
import com.nexadesk.backend.repository.TicketRepository;
import com.nexadesk.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketController(
            TicketRepository ticketRepository,
            UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User account not found"));
    }

    private boolean isAdmin(User user) {
        return "ADMIN".equalsIgnoreCase(user.getRole());
    }

    private boolean canAccessTicket(User user, Ticket ticket) {
        return isAdmin(user)
                || (ticket.getCreatedBy() != null
                    && ticket.getCreatedBy().equals(user.getId()))
                || (ticket.getAssignedTo() != null
                    && ticket.getAssignedTo().equals(user.getId()));
    }

    @GetMapping
    public List<Ticket> getAllTickets(Authentication authentication) {
        User user = currentUser(authentication);

        if (isAdmin(user)) {
            return ticketRepository.findAll();
        }

        return ticketRepository.findByCreatedByOrAssignedTo(
                user.getId(), user.getId());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(
            @PathVariable Integer id,
            Authentication authentication) {

        User user = currentUser(authentication);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ticket not found"));

        if (!canAccessTicket(user, ticket)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You cannot access this ticket");
        }

        return ResponseEntity.ok(ticket);
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(
            @Valid @RequestBody TicketRequest request,
            Authentication authentication) {

        User user = currentUser(authentication);

        Ticket ticket = new Ticket();
        ticket.setSubject(request.getSubject());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(
                request.getPriority() == null ? "MEDIUM" : request.getPriority());
        ticket.setStatus("OPEN");
        ticket.setCreatedBy(user.getId());
        ticket.setAssignedTo(null);

        Ticket savedTicket = ticketRepository.save(ticket);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedTicket);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable Integer id,
            @Valid @RequestBody TicketStatusRequest request,
            Authentication authentication) {

        User user = currentUser(authentication);

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ticket not found"));

        if (!canAccessTicket(user, ticket)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You cannot update this ticket");
        }

        ticket.setStatus(request.getStatus());
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }

    @PutMapping("/{id}/assignment")
    public ResponseEntity<Ticket> updateTicketAssignment(
            @PathVariable Integer id,
            @Valid @RequestBody TicketAssignmentRequest request,
            Authentication authentication) {

        User user = currentUser(authentication);

        if (!isAdmin(user)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only administrators can assign tickets");
        }

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Ticket not found"));

        User employee = userRepository.findById(request.getAssignedTo())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Assigned user not found"));

        if (!"EMPLOYEE".equalsIgnoreCase(employee.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tickets can only be assigned to employees");
        }

        ticket.setAssignedTo(employee.getId());
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }
}