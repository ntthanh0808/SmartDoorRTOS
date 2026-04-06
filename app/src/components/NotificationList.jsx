import { View, Text, FlatList, StyleSheet } from 'react-native';

const CATEGORY_COLOR = {
  access: '#22c55e',
  alert:  '#ef4444',
  motion: '#eab308',
};

export default function NotificationList({ notifications, connected = false }) {
  if (!connected) {
    return <Text style={styles.disconnected}>Chưa được kết nối</Text>;
  }

  if (!notifications.length) {
    return <Text style={styles.empty}>Chưa có thông báo</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              { borderLeftColor: CATEGORY_COLOR[item.category] ?? '#9ca3af' },
            ]}
          >
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>
              {(item.time instanceof Date ? item.time : new Date(item.time))
                .toLocaleTimeString('vi-VN')}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#9ca3af', fontSize: 13 },
  disconnected: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  container: { 
    height: 320,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  list: { 
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  item: {
    borderLeftWidth: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 1,
  },
  message: { fontSize: 13, color: '#1f2937', marginBottom: 4 },
  time: { fontSize: 11, color: '#9ca3af' },
});
