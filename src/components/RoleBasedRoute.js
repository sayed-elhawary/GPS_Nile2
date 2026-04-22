// src/components/RoleBasedRoute.js (نسخة مؤقتة للتجربة)
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // ✅ تجاوز التحقق من الصلاحيات مؤقتاً
  console.log('Access granted (bypassing role check)');
  return children;
};

export default RoleBasedRoute;