import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketContext } from '../context/WebSocketContext';
import UserHomeScreen from '../screens/UserHomeScreen';

const Stack = createNativeStackNavigator();

export default function UserNavigator() {
  const ws = useWebSocket();
  const { logout, user } = useAuth();

  return (
    <WebSocketContext.Provider value={ws}>
      <Stack.Navigator>
        <Stack.Screen
          name="UserHome"
          component={UserHomeScreen}
          options={{
            title: `SmartDoor  ·  ${user?.fullName ?? ''}`,
            headerTitleStyle: { fontSize: 14 },
            headerStyle: { backgroundColor: '#1e3a5f' },
            headerTintColor: '#fff',
            headerRight: () => (
              <TouchableOpacity onPress={logout}>
                <Text style={{ color: '#fff', fontSize: 14 }}>Đăng xuất</Text>
              </TouchableOpacity>
            ),
          }}
        />
      </Stack.Navigator>
    </WebSocketContext.Provider>
  );
}
