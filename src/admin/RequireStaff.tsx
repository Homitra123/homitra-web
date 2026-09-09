import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStaff } from './useStaff';
import Unauthorized from './pages/Unauthorized';

interface RequireStaffProps {
  children: React.ReactNode;
  roles?: string[];
}

const RequireStaff = ({ children, roles }: RequireStaffProps) => {
  const { user, loading: authLoading } = useAuth();
  const { staff, loading: staffLoading } = useStaff();
  const location = useLocation();

  if (authLoading || staffLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!staff || staff.status !== 'active') {
    return <Unauthorized />;
  }

  if (roles && roles.length > 0 && !roles.includes(staff.role)) {
    return <Unauthorized />;
  }

  return <>{children}</>;
};

export default RequireStaff;
