import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg">SmartDoor</span>
        {user.role === 'admin' && (
          <>
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">Dashboard</Link>
            <Link to="/users" className="text-sm text-gray-600 hover:text-blue-600">Người dùng</Link>
            <Link to="/history" className="text-sm text-gray-600 hover:text-blue-600">Lịch sử</Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user.fullName}</span>
        <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Đăng xuất</button>
      </div>
    </nav>
  );
}
