const statusMap = {
  opened: { label: 'Đã mở', color: 'bg-green-500', animate: false },
  opening: { label: 'Đang mở...', color: 'bg-yellow-500', animate: true },
  closed: { label: 'Đã đóng', color: 'bg-gray-500', animate: false },
  closing: { label: 'Đang đóng...', color: 'bg-yellow-500', animate: true },
};

export default function DoorStatus({ status }) {
  const info = statusMap[status] || statusMap.closed;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-4 h-4 rounded-full ${info.color} ${info.animate ? 'animate-pulse' : ''}`} />
      <span className="text-lg font-semibold">{info.label}</span>
    </div>
  );
}
