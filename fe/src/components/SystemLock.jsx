import { useState } from 'react';
import api from '../api/axios';

export default function SystemLock({ isLocked, setIsLocked }) {
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const action = isLocked ? 'unlock' : 'lock';
      await api.post(`/door/${action}`);
      setIsLocked(!isLocked);
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-6 py-3 rounded-lg font-semibold text-white ${
        isLocked ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
      } disabled:opacity-50`}
    >
      {isLocked ? 'Mở khóa hệ thống' : 'Khóa hệ thống'}
    </button>
  );
}
