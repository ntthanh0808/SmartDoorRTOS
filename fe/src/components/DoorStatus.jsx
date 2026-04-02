import { useState, useEffect } from 'react';

const statusMap = {
  opened: { label: 'Đã mở', color: 'bg-green-500', animate: false },
  opening: { label: 'Đang mở...', color: 'bg-yellow-500', animate: true },
  closed: { label: 'Đã đóng', color: 'bg-gray-500', animate: false },
  closing: { label: 'Đang đóng...', color: 'bg-yellow-500', animate: true },
};

export default function DoorStatus({ status }) {
  const [countdown, setCountdown] = useState(5);
  const info = statusMap[status] || statusMap.closed;

  useEffect(() => {
    if (status === 'opened') {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status]);

  return (
    <div className="flex items-center gap-3">
      <div className={`w-4 h-4 rounded-full ${info.color} ${info.animate ? 'animate-pulse' : ''}`} />
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">{info.label}</span>
        {status === 'opened' && countdown >= 0 && (
          <span className="text-lg font-semibold text-black">({countdown}s...)</span>
        )}
      </div>
    </div>
  );
}
