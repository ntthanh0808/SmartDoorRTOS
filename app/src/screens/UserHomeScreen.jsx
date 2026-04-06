import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import api from '../api/axios';
import { useWebSocketContext } from '../context/WebSocketContext';
import DoorStatus from '../components/DoorStatus';
import DoorControl from '../components/DoorControl';

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

export default function UserHomeScreen() {
  const { doorStatus, isLocked, setDoorStatus, setIsLocked } =
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
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
      }
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>SmartDoor</Text>
          <RealTimeClock />
        </View>
        <DoorStatus status={doorStatus} />
        <View style={styles.divider} />
        <DoorControl doorStatus={doorStatus} isLocked={isLocked} />
        {isLocked && (
          <Text style={styles.lockWarning}>Hệ thống đang khóa</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clock: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#4b5563',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    width: '100%',
  },
  lockWarning: {
    color: '#ea580c',
    fontSize: 13,
  },
});
