import { useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { WS_URL } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [doorStatus, setDoorStatus] = useState('closed');
  const [isLocked, setIsLocked] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    let reconnectTimer;
    let closed = false;

    SecureStore.getItemAsync('token').then((token) => {
      if (!token || closed) return;

      function connect() {
        if (closed) return;
        
        try {
          const wsUrl = `${WS_URL}/client?token=${token}`;
          console.log('Connecting to WebSocket:', wsUrl);
          
          let ws;
          try {
            ws = new WebSocket(wsUrl);
          } catch (err) {
            console.error('WebSocket constructor error:', err);
            setConnected(false);
            if (!closed) {
              reconnectTimer = setTimeout(connect, 3000);
            }
            return;
          }
          
          wsRef.current = ws;

          ws.onopen = () => {
            console.log('WebSocket connected successfully');
            setConnected(true);
          };

          ws.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data);
              console.log('WebSocket message:', msg);
              
              if (msg.type === 'door_status') {
                setDoorStatus(msg.status);
              } else if (msg.type === 'system_state') {
                setIsLocked(msg.is_locked);
              } else if (msg.type === 'notification') {
                setNotifications((prev) => [
                  { 
                    id: Date.now(), 
                    message: msg.message, 
                    category: msg.category, 
                    time: new Date() 
                  },
                  ...prev.slice(0, 49),
                ]);
              }
            } catch (err) {
              console.error('WebSocket message parse error:', err);
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setConnected(false);
          };

          ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            setConnected(false);
            if (!closed) {
              console.log('Reconnecting in 3 seconds...');
              reconnectTimer = setTimeout(connect, 3000);
            }
          };
          
        } catch (error) {
          console.error('WebSocket connection error:', error);
          setConnected(false);
          if (!closed) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        }
      }

      connect();
    });

    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [user]);

  return { doorStatus, isLocked, notifications, connected, setDoorStatus, setIsLocked };
}
