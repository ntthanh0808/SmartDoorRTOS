import { View, Text, FlatList, StyleSheet } from 'react-native';

const METHOD_LABEL = { rfid: 'Thẻ RFID', web: 'Web', app: 'App' };

export default function HistoryTable({ history, refreshControl }) {
  if (!history.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Chưa có lịch sử</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={refreshControl}
      renderItem={({ item: h }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.time}>
              {new Date(h.timestamp).toLocaleString('vi-VN')}
            </Text>
            <View style={[styles.badge, h.success ? styles.success : styles.failure]}>
              <Text style={[styles.badgeText, h.success ? styles.successText : styles.failureText]}>
                {h.success ? 'Thành công' : 'Thất bại'}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.meta}>
              {h.user_name || '—'}  ·  {h.action === 'open' ? 'Mở cửa' : 'Đóng cửa'}
            </Text>
            <Text style={styles.meta}>
              {METHOD_LABEL[h.method] ?? h.method}
            </Text>
          </View>

          {h.card_uid ? (
            <Text style={styles.mono}>Thẻ: {h.card_uid}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 13 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 12, color: '#374151' },
  meta: { fontSize: 12, color: '#6b7280' },
  mono: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  success:     { backgroundColor: '#dcfce7' },
  successText: { color: '#16a34a' },
  failure:     { backgroundColor: '#fee2e2' },
  failureText: { color: '#dc2626' },
});
