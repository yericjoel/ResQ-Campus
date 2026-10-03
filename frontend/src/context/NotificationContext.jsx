import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { connectSocket } from '../services/socket';

const NotificationContext = createContext(null);

/** Short alert tone for administrators when a new SOS arrives (ignored if the browser blocks audio). */
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available */
  }
}

export function NotificationProvider({ children }) {
  const { user, token, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [status, setStatus] = useState('disconnected');
  const listeners = useRef(new Map());

  // ---- tiny event bus so pages can react to live events ----
  const emit = useCallback((event, payload) => {
    listeners.current.get(event)?.forEach((fn) => fn(payload));
  }, []);

  const subscribeEvent = useCallback((event, fn) => {
    if (!listeners.current.has(event)) listeners.current.set(event, new Set());
    listeners.current.get(event).add(fn);
    return () => listeners.current.get(event)?.delete(fn);
  }, []);

  // ---- toasts ----
  const dismissToast = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const pushToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((list) => [...list.slice(-3), { id, ...toast }]);
    if (!toast.sticky) {
      // UI-only auto-dismiss; real-time data itself always comes from the WebSocket.
      setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 7000);
    }
  }, []);

  // ---- notification list (persisted in MySQL) ----
  const refresh = useCallback(async () => {
    try {
      setNotifications(await notificationService.list());
    } catch {
      /* the bell simply keeps its last state */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoaded(false);
      return;
    }
    refresh();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- WebSocket / STOMP connection ----
  useEffect(() => {
    if (!user || !token) return undefined;

    const onNotification = (n) => {
      setNotifications((list) => (list.some((x) => x.id === n.id) ? list : [n, ...list]));
      const critical = n.type === 'SOS' || n.title.startsWith('CRITICAL');
      pushToast({ title: n.title, message: n.message, tone: critical ? 'danger' : 'info', sticky: critical, notification: n });
      emit('notification', n);
    };

    const topics = [
      { destination: `/topic/user/${user.id}/notifications`, onMessage: onNotification },
      { destination: '/topic/announcements', onMessage: (p) => emit('announcement', p) },
    ];
    if (isAdmin) {
      topics.push({
        destination: '/topic/admin/sos',
        onMessage: (p) => {
          if (p.event === 'NEW') beep();
          emit('adminSos', p);
        },
      });
      topics.push({ destination: '/topic/incidents', onMessage: (p) => emit('incident', p) });
    } else {
      topics.push({ destination: `/topic/user/${user.id}/sos`, onMessage: (p) => emit('sos', p) });
    }

    return connectSocket({
      token,
      topics,
      onStatus: setStatus,
      onReconnect: () => {
        refresh();
        emit('resync');
      },
    });
  }, [user?.id, token, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- actions ----
  const markRead = useCallback(async (id) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationService.markRead(id);
    } catch {
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllRead();
    } catch {
      refresh();
    }
  }, [refresh]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications, unreadCount, loaded, status, markRead, markAllRead, refresh,
      toasts, dismissToast, pushToast, subscribeEvent,
    }),
    [notifications, unreadCount, loaded, status, markRead, markAllRead, refresh, toasts, dismissToast, pushToast, subscribeEvent],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}

/** Calls `handler(payload)` whenever the given live event arrives (notification, sos, adminSos, incident, announcement, resync). */
export function useRealtime(event, handler) {
  const { subscribeEvent } = useNotifications();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => subscribeEvent(event, (payload) => ref.current(payload)), [event, subscribeEvent]);
}
