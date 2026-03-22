export default function UserTable({ users, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Username</th>
            <th className="px-4 py-3">Họ tên</th>
            <th className="px-4 py-3">Vai trò</th>
            <th className="px-4 py-3">Thẻ RFID</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{u.id}</td>
              <td className="px-4 py-3">{u.username}</td>
              <td className="px-4 py-3">{u.full_name}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{u.card_uid || '—'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {u.is_active ? 'Hoạt động' : 'Khóa'}
                </span>
              </td>
              <td className="px-4 py-3 flex gap-2">
                <button onClick={() => onEdit(u)} className="text-blue-600 hover:underline text-xs">Sửa</button>
                <button onClick={() => onDelete(u.id)} className="text-red-600 hover:underline text-xs">Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
