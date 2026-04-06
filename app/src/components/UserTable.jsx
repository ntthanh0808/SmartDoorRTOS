import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

export default function UserTable({ users, onEdit, onDelete, refreshControl }) {
  return (
    <FlatList
      data={users}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={refreshControl}
      renderItem={({ item: u }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{u.full_name}</Text>
            <View style={[styles.badge, u.role === 'admin' ? styles.badgeAdmin : styles.badgeUser]}>
              <Text style={[styles.badgeText, u.role === 'admin' ? styles.badgeAdminText : styles.badgeUserText]}>
                {u.role}
              </Text>
            </View>
          </View>

          <Text style={styles.meta}>@{u.username}  ·  ID: {u.id}</Text>

          <View style={styles.row}>
            <Text style={styles.meta}>
              Thẻ: <Text style={styles.mono}>{u.card_uid || '—'}</Text>
            </Text>
            <View style={[styles.badge, u.is_active ? styles.badgeActive : styles.badgeLocked]}>
              <Text style={[styles.badgeText, u.is_active ? styles.badgeActiveText : styles.badgeLockedText]}>
                {u.is_active ? 'Hoạt động' : 'Khóa'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(u)}>
              <Text style={styles.editText}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(u.id)}>
              <Text style={styles.deleteText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  meta: { fontSize: 12, color: '#6b7280' },
  mono: { fontFamily: 'monospace', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  badgeAdmin:       { backgroundColor: '#f3e8ff' },
  badgeAdminText:   { color: '#7c3aed' },
  badgeUser:        { backgroundColor: '#dbeafe' },
  badgeUserText:    { color: '#1d4ed8' },
  badgeActive:      { backgroundColor: '#dcfce7' },
  badgeActiveText:  { color: '#16a34a' },
  badgeLocked:      { backgroundColor: '#fee2e2' },
  badgeLockedText:  { color: '#dc2626' },
  actions: { flexDirection: 'row', gap: 16, marginTop: 4 },
  editText:   { color: '#2563eb', fontSize: 13 },
  deleteText: { color: '#dc2626', fontSize: 13 },
});
