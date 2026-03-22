import { useEffect } from 'react';
import api from '../api/axios';
import DoorStatus from '../components/DoorStatus';
import DoorControl from '../components/DoorControl';
import SystemLock from '../components/SystemLock';
import NotificationList from '../components/NotificationList';

export default function DashboardPage({ doorStatus, isLocked, notifications, setDoorStatus, setIsLocked }) {
  useEffect(() => {
    api.get('/door/status').then(({ data }) => {
      setDoorStatus(data.door_status);
      setIsLocked(data.is_locked);
    });
  }, [setDoorStatus, setIsLocked]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Door status & control */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Trạng thái cửa</h3>
          <DoorStatus status={doorStatus} />
          <DoorControl doorStatus={doorStatus} isLocked={isLocked} />
          <div className="pt-2 border-t">
            <SystemLock isLocked={isLocked} setIsLocked={setIsLocked} />
            {isLocked && <p className="text-orange-600 text-sm mt-2">Hệ thống đang khóa - không thể mở cửa bằng thẻ</p>}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Thông báo</h3>
          <NotificationList notifications={notifications} />
        </div>
      </div>
    </div>
  );
}
