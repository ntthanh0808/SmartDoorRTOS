import { useEffect } from 'react';
import api from '../api/axios';
import DoorStatus from '../components/DoorStatus';
import DoorControl from '../components/DoorControl';

export default function UserHomePage({ doorStatus, isLocked, setDoorStatus, setIsLocked }) {
  useEffect(() => {
    api.get('/door/status').then(({ data }) => {
      setDoorStatus(data.door_status);
      setIsLocked(data.is_locked);
    });
  }, [setDoorStatus, setIsLocked]);

  return (
    <div className="p-6 flex justify-center">
      <div className="bg-white rounded-xl shadow p-8 space-y-6 w-full max-w-md text-center">
        <h2 className="text-xl font-bold">SmartDoor</h2>
        <DoorStatus status={doorStatus} />
        <DoorControl doorStatus={doorStatus} isLocked={isLocked} />
        {isLocked && <p className="text-orange-600 text-sm">Hệ thống đang khóa</p>}
      </div>
    </div>
  );
}
