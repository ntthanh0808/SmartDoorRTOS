import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../api/axios';
import HistoryTable from '../components/HistoryTable';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [method, setMethod] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const params = {};
      if (method) params.method = method;
      const { data } = await api.get('/history', { params });
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [method]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Phương thức:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={method}
            onValueChange={setMethod}
            style={styles.picker}
            dropdownIconColor="#374151"
          >
            <Picker.Item label="Tất cả" value="" />
            <Picker.Item label="Thẻ RFID" value="rfid" />
            <Picker.Item label="Web" value="web" />
            <Picker.Item label="App" value="app" />
          </Picker>
        </View>
      </View>

      <HistoryTable history={history} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
      } />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterLabel: { fontSize: 14, color: '#374151', marginRight: 8 },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: { height: 44, color: '#1f2937' },
});
