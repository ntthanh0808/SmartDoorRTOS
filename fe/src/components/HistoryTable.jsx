const methodLabel = { rfid: 'Thẻ RFID', web: 'Web' };

export default function HistoryTable({ history }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Thời gian</th>
            <th className="px-4 py-3">Người dùng</th>
            <th className="px-4 py-3">Hành động</th>
            <th className="px-4 py-3">Phương thức</th>
            <th className="px-4 py-3">Thẻ RFID</th>
            <th className="px-4 py-3">Kết quả</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{new Date(h.timestamp).toLocaleString('vi-VN')}</td>
              <td className="px-4 py-3">{h.user_name || '—'}</td>
              <td className="px-4 py-3">{h.action === 'open' ? 'Mở cửa' : 'Đóng cửa'}</td>
              <td className="px-4 py-3">{methodLabel[h.method] || h.method}</td>
              <td className="px-4 py-3 font-mono text-xs">{h.card_uid || '—'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs ${h.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {h.success ? 'Thành công' : 'Thất bại'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
