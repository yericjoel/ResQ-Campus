package com.resq.campus.service;

import com.resq.campus.dto.Dtos.NotificationDto;
import com.resq.campus.model.Enums.NotificationType;
import com.resq.campus.model.Enums.Role;
import com.resq.campus.model.Notification;
import com.resq.campus.model.User;
import com.resq.campus.repository.NotificationRepository;
import com.resq.campus.repository.UserRepository;
import com.resq.campus.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

/**
 * Saves notifications in MySQL and pushes them to connected clients over WebSocket/STOMP.
 * Pushes happen after the database transaction commits, so clients never see data that was rolled back.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifications;
    private final UserRepository users;
    private final SimpMessagingTemplate messaging;

    /** Sends any payload to a STOMP topic once the current transaction has committed. */
    public void publish(String destination, Object payload) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    messaging.convertAndSend(destination, payload);
                }
            });
        } else {
            messaging.convertAndSend(destination, payload);
        }
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void notifyUser(Long userId, String title, String message, NotificationType type, Long referenceId) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setMessage(truncate(message));
        n.setType(type);
        n.setReferenceId(referenceId);
        NotificationDto dto = Mapper.notification(notifications.save(n));
        publish("/topic/user/" + userId + "/notifications", dto);
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void notifyAdmins(String title, String message, NotificationType type, Long referenceId) {
        List<User> admins = users.findByRoleInAndActiveTrue(List.of(Role.ADMIN, Role.SECURITY));
        admins.forEach(a -> notifyUser(a.getId(), title, message, type, referenceId));
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public void notifyEveryone(String title, String message, NotificationType type, Long referenceId) {
        users.findByActiveTrue().forEach(u -> notifyUser(u.getId(), title, message, type, referenceId));
    }

    private String truncate(String s) {
        return s != null && s.length() > 480 ? s.substring(0, 477) + "..." : s;
    }
}
