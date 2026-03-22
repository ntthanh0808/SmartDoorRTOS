import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [doorStatus, setDoorStatus] = useState('closed');
  const [isLocked, setIsLocked] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    let reconnectTimer;
    let closed = false;

    function connect() {
      if (closed) return;
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
        if (!closed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [user]);

  return { doorStatus, isLocked, notifications, setDoorStatus, setIsLocked };
}
