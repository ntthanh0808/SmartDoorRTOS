import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_URL } from '../utils/constants';

export function useWebSocket() {
  const wsRef = useRef(null);
  const [doorStatus, setDoorStatus] = useState('closed');
  const [isLocked, setIsLocked] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}/client?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'door_status') {
        setDoorStatus(msg.status);
      } else if (msg.type === 'system_state') {
        setIsLocked(msg.is_locked);
      } else if (msg.type === 'notification') {
        setNotifications((prev) => [
          { id: Date.now(), message: msg.message, category: msg.category, time: new Date() },
          ...prev.slice(0, 49),
        ]);
      }
    };

    ws.onclose = () => {
      setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { doorStatus, isLocked, notifications, setDoorStatus, setIsLocked };
}
