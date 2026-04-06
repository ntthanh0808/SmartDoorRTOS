import { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import api from '../api/axios';

export default function SystemLock({ isLocked, setIsLocked, doorStatus }) {
  const [loading, setLoading] = useState(false);
  const isDoorClosed = doorStatus === 'closed';

  const toggle = async () => {
    if (!isDoorClosed) return;
    
    setLoading(true);
    try {
      const action = isLocked ? 'unlock' : 'lock';
      await api.post(`/door/${action}`);
      setIsLocked(!isLocked);
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.btn,
          isLocked ? styles.locked : styles.unlocked,
          (loading || !isDoorClosed) && styles.disabled,
        ]}
        onPress={toggle}
        disabled={loading || !isDoorClosed}
      >
        <Text style={styles.text}>
          {isLocked ? 'Mở khóa hệ thống' : 'Khóa hệ thống'}
        </Text>
      </TouchableOpacity>
      {!isDoorClosed && (
        <Text style={styles.warning}>
          Chỉ có thể khóa/mở hệ thống khi cửa đã đóng
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  locked:   { backgroundColor: '#ea580c' },
  unlocked: { backgroundColor: '#2563eb' },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontWeight: '600', fontSize: 15 },
  warning: { color: '#dc2626', fontSize: 13, marginTop: 8 },
});
