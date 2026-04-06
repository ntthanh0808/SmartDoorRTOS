import { useState, useEffect } from 'react';
import api from '../api/axios';
import HistoryTable from '../components/HistoryTable';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [method, setMethod] = useState('');

  const fetchHistory = () => {
    const params = {};
    if (method) params.method = method;
    api.get('/history', { params }).then(({ data }) => setHistory(data));
  };

  useEffect(() => { fetchHistory(); }, [method]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Lịch sử mở cửa</h2>
        <select
          value={method} onChange={(e) => setMethod(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Tất cả phương thức</option>
          <option value="rfid">Thẻ RFID</option>
          <option value="web">Web</option>
          <option value="app">App</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow">
        <HistoryTable history={history} />
      </div>
    </div>
  );
}
