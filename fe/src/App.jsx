import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import HistoryPage from './pages/HistoryPage';
import UserHomePage from './pages/UserHomePage';

function AppRoutes() {
  const { user } = useAuth();
  const ws = useWebSocket();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/dashboard' : '/home'} /> : <LoginPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <DashboardPage {...ws} />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute requiredRole="admin"><HistoryPage /></ProtectedRoute>
        } />
        <Route path="/home" element={
          <ProtectedRoute>
            <UserHomePage {...ws} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
