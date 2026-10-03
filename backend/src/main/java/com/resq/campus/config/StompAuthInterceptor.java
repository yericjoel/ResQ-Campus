package com.resq.campus.config;

import com.resq.campus.security.CurrentUser;
import com.resq.campus.security.TokenAuthenticator;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Secures the WebSocket channel:
 *  - CONNECT must carry a valid JWT in the "Authorization" header
 *  - clients may only subscribe to topics they are allowed to see
 *  - clients may not publish messages (only the server pushes events)
 */
@Component
@RequiredArgsConstructor
public class StompAuthInterceptor implements ChannelInterceptor {

    private final TokenAuthenticator authenticator;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) return message;

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            String header = accessor.getFirstNativeHeader("Authorization");
            String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
            Authentication auth = authenticator.authenticate(token);
            if (auth == null) throw new MessagingException("Unauthorized");
            accessor.setUser(auth);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            Authentication auth = accessor.getUser() instanceof Authentication a ? a : null;
            if (auth == null || !canSubscribe((CurrentUser) auth.getPrincipal(), accessor.getDestination())) {
                throw new MessagingException("Forbidden");
            }
        } else if (StompCommand.SEND.equals(command)) {
            throw new MessagingException("Clients cannot publish messages");
        }
        return message;
    }

    private boolean canSubscribe(CurrentUser user, String destination) {
        if (destination == null) return false;
        if (destination.equals("/topic/announcements")) return true;
        if (destination.equals("/topic/admin/sos") || destination.equals("/topic/incidents")) {
            return user.isAdmin();
        }
        // /topic/user/{id}/notifications and /topic/user/{id}/sos belong to that user only
        String prefix = "/topic/user/" + user.id() + "/";
        return destination.equals(prefix + "notifications") || destination.equals(prefix + "sos");
    }
}
