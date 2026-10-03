import { Client } from '@stomp/stompjs';

function brokerUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${window.location.host}/ws`;
}

/**
 * Opens a STOMP-over-WebSocket connection to Spring Boot (/ws), authenticated with the JWT.
 * `topics` is a list of { destination, onMessage(payload) }.
 * Subscriptions are re-created automatically after a reconnect, and onReconnect() is called
 * so the app can reload anything it may have missed while offline.
 */
export function connectSocket({ token, topics, onStatus, onReconnect }) {
  let connectedBefore = false;

  const client = new Client({
    brokerURL: brokerUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      topics.forEach(({ destination, onMessage }) => {
        client.subscribe(destination, (frame) => {
          try {
            onMessage(JSON.parse(frame.body));
          } catch {
            /* ignore malformed frames */
          }
        });
      });
      onStatus?.('connected');
      if (connectedBefore) onReconnect?.();
      connectedBefore = true;
    },
    onWebSocketClose: () => onStatus?.('disconnected'),
    onStompError: () => onStatus?.('error'),
  });

  onStatus?.('connecting');
  client.activate();
  return () => client.deactivate();
}
