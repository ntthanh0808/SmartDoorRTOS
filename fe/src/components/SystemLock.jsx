import { useState } from 'react';
import api from '../api/axios';

export default function SystemLock({ isLocked, setIsLocked, doorStatus }) {
  const [loading, setLoading] = useState(false);
  const isDoorClosed = doorStatus === 'closed';

  const toggle = async () => {
    if (!isDoorClosed) return;
    
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
    <div>
      <button
        onClick={toggle}
        disabled={loading || !isDoorClosed}
        className={`px-6 py-3 rounded-lg font-semibold text-white ${
          isLocked ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLocked ? 'Mở khóa hệ thống' : 'Khóa hệ thống'}
      </button>
      {!isDoorClosed && (
        <p className="text-red-600 text-sm mt-2">Chỉ có thể khóa/mở hệ thống khi cửa đã đóng</p>
      )}
    </div>
  );
}
