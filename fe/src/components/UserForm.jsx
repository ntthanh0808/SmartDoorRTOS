import { useState, useEffect } from 'react';

export default function UserForm({ user, onSubmit, onCancel }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'user',
    card_uid: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        password: '',
        full_name: user.full_name,
        role: user.role,
        card_uid: user.card_uid || '',
      });
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (isEdit && !data.password) delete data.password;
    if (!data.card_uid) data.card_uid = null;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
      <h3 className="text-lg font-semibold">{isEdit ? 'Sửa người dùng' : 'Thêm người dùng'}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input name="username" value={form.username} onChange={handleChange} disabled={isEdit}
            className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu {isEdit && <span className="text-gray-400">(để trống nếu không đổi)</span>}
          </label>
          <input name="password" type="password" value={form.password} onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm" {...(!isEdit && { required: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
          <input name="full_name" value={form.full_name} onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
          <select name="role" value={form.role} onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm">
            <option value="user">Người dùng</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mã thẻ RFID (tùy chọn)</label>
          <input name="card_uid" value={form.card_uid} onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm font-mono" placeholder="VD: AB:CD:EF:12" />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          {isEdit ? 'Cập nhật' : 'Tạo'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300">
          Hủy
        </button>
      </div>
    </form>
  );
}
