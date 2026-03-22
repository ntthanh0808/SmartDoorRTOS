import { useState, useEffect } from 'react';
import api from '../api/axios';
import UserTable from '../components/UserTable';
import UserForm from '../components/UserForm';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = () => api.get('/users').then(({ data }) => setUsers(data));

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (data) => {
    try {
      await api.post('/users', data);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await api.put(`/users/${editUser.id}`, data);
      setEditUser(null);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa người dùng này?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý người dùng</h2>
        <button
          onClick={() => { setEditUser(null); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          + Thêm người dùng
        </button>
      </div>

      {showForm && (
        <UserForm
          user={editUser}
          onSubmit={editUser ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditUser(null); }}
        />
      )}

      <div className="bg-white rounded-xl shadow">
        <UserTable
          users={users}
          onEdit={(u) => { setEditUser(u); setShowForm(true); }}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
