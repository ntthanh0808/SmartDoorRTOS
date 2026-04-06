import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import api from '../api/axios';
import { useWebSocketContext } from '../context/WebSocketContext';
import DoorStatus from '../components/DoorStatus';
import DoorControl from '../components/DoorControl';
import SystemLock from '../components/SystemLock';
import NotificationList from '../components/NotificationList';

function RealTimeClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${dayOfWeek} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <Text style={styles.clock}>{formatDate(currentTime)}</Text>
  );
}

export default function DashboardScreen() {
  const { doorStatus, isLocked, notifications, connected, setDoorStatus, setIsLocked } =
    useWebSocketContext();
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/door/status');
      setDoorStatus(data.door_status);
      setIsLocked(data.is_locked);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
      }
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Trạng thái cửa</Text>
        <DoorStatus status={doorStatus} />
        <DoorControl doorStatus={doorStatus} isLocked={isLocked} />
        <View style={styles.divider} />
        <SystemLock isLocked={isLocked} setIsLocked={setIsLocked} doorStatus={doorStatus} />
        {isLocked && (
          <Text style={styles.lockWarning}>
            Hệ thống đang khóa - không thể mở cửa
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.notificationHeader}>
          <Text style={styles.sectionTitle}>Thông báo</Text>
          <RealTimeClock />
        </View>
        <NotificationList notifications={notifications} connected={connected} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clock: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#4b5563',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  lockWarning: {
    color: '#ea580c',
    fontSize: 13,
  },
});
