const categoryStyle = {
  access: 'border-l-green-500',
  alert: 'border-l-red-500',
  motion: 'border-l-yellow-500',
};

export default function NotificationList({ notifications }) {
  if (!notifications.length) {
    return <p className="text-gray-400 text-sm">Chưa có thông báo</p>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`border-l-4 ${categoryStyle[n.category] || 'border-l-gray-400'} bg-gray-50 px-3 py-2 text-sm`}
        >
          <p>{n.message}</p>
          <p className="text-gray-400 text-xs mt-1">{n.time.toLocaleTimeString('vi-VN')}</p>
        </div>
      ))}
    </div>
  );
}
