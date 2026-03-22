import { useState } from 'react';
import api from '../api/axios';

export default function DoorControl({ doorStatus, isLocked }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await api.post(`/door/${action}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleAction('open')}
        disabled={loading || isLocked || doorStatus === 'opened' || doorStatus === 'opening'}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Mở cửa
      </button>
      <button
        onClick={() => handleAction('close')}
        disabled={loading || doorStatus === 'closed' || doorStatus === 'closing'}
        className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Đóng cửa
      </button>
    </div>
  );
}
