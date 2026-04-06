import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import api from '../api/axios';
import UserTable from '../components/UserTable';
import UserForm from '../components/UserForm';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/users', data);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Lỗi');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await api.put(`/users/${editUser.id}`, data);
      setEditUser(null);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.detail || 'Lỗi');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Xóa người dùng này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/${id}`);
            fetchUsers();
          } catch (err) {
            Alert.alert('Lỗi', err.response?.data?.detail || 'Lỗi');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý người dùng</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { setEditUser(null); setShowForm(true); }}
        >
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <UserTable
        users={users}
        onEdit={(u) => { setEditUser(u); setShowForm(true); }}
        onDelete={handleDelete}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      />

      <UserForm
        visible={showForm}
        user={editUser}
        onSubmit={editUser ? handleUpdate : handleCreate}
        onCancel={() => { setShowForm(false); setEditUser(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
