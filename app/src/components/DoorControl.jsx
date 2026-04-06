import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import api from '../api/axios';

export default function DoorControl({ doorStatus, isLocked }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await api.post(`/door/${action}`);
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  const openDisabled =
    loading || isLocked || doorStatus === 'opened' || doorStatus === 'opening';
  const closeDisabled =
    loading || doorStatus === 'closed' || doorStatus === 'closing';

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, styles.openBtn, openDisabled && styles.disabled]}
        onPress={() => handleAction('open')}
        disabled={openDisabled}
      >
        <Text style={styles.btnText}>Mở cửa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.closeBtn, closeDisabled && styles.disabled]}
        onPress={() => handleAction('close')}
        disabled={closeDisabled}
      >
        <Text style={styles.btnText}>Đóng cửa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  openBtn:  { backgroundColor: '#16a34a' },
  closeBtn: { backgroundColor: '#dc2626' },
  disabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
