import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketContext } from '../context/WebSocketContext';
import DashboardScreen from '../screens/DashboardScreen';
import UsersScreen from '../screens/UsersScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { TouchableOpacity, Text } from 'react-native';

const Tab = createBottomTabNavigator();

const ICON = { Dashboard: 'grid', Users: 'people', History: 'time' };

export default function AdminNavigator() {
  const ws = useWebSocket();
  const { logout, user } = useAuth();

  return (
    <WebSocketContext.Provider value={ws}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICON[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#9ca3af',
          headerStyle: { backgroundColor: '#1e3a5f' },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>Đăng xuất</Text>
            </TouchableOpacity>
          ),
          headerTitle: `SmartDoor  ·  ${user?.fullName ?? ''}`,
          headerTitleStyle: { fontSize: 14, color: '#fff' },
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ tabBarLabel: 'Dashboard' }}
        />
        <Tab.Screen
          name="Users"
          component={UsersScreen}
          options={{ tabBarLabel: 'Người dùng' }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ tabBarLabel: 'Lịch sử' }}
        />
      </Tab.Navigator>
    </WebSocketContext.Provider>
  );
}
