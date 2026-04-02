import { useEffect, useState } from 'react';
import api from '../api/axios';
import DoorStatus from '../components/DoorStatus';
import DoorControl from '../components/DoorControl';
import SystemLock from '../components/SystemLock';
import NotificationList from '../components/NotificationList';

function RealTimeClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = daysOfWeek[date.getDay()];
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${dayOfWeek} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="text-base font-mono text-gray-600">
      {formatDate(currentTime)}
    </div>
  );
}

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
            <SystemLock isLocked={isLocked} setIsLocked={setIsLocked} doorStatus={doorStatus} />
            {isLocked && <p className="text-orange-600 text-sm mt-2">Hệ thống đang khóa - không thể mở cửa</p>}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Thông báo</h3>
            <RealTimeClock />
          </div>
          <NotificationList notifications={notifications} />
        </div>
      </div>
    </div>
  );
}
