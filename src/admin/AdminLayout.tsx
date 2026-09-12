import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Wallet,
  UserCog,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStaff, StaffRole } from './useStaff';

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  enabled: boolean;
  roles?: StaffRole[];
}

const AdminLayout = () => {
  const { profile, signOut } = useAuth();
  const { staff } = useStaff();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, enabled: true },
    { label: 'Staff', path: '/admin/staff', icon: UserCog, enabled: true, roles: ['super_admin'] },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag, enabled: true },
    { label: 'Customers', path: '/admin/customers', icon: Users, enabled: true },
    { label: 'Finance', path: '/admin/finance', icon: Wallet, enabled: false },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  const isActive = (path: string) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const visibleItems = navItems.filter((item) => {
    if (item.roles && staff && !item.roles.includes(staff.role)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-sky-500/15 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">Homitra</h1>
              <p className="text-slate-500 text-xs">Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.enabled ? item.path : '#'}
                onClick={(e) => {
                  if (!item.enabled) e.preventDefault();
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sky-500/15 text-sky-300'
                    : item.enabled
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
                {!item.enabled && (
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-600">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-700/50">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors w-full"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <LayoutDashboard size={20} />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {profile?.full_name || profile?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-xs text-slate-500">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {staff && (
              <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full capitalize">
                <ShieldCheck size={13} />
                {staff.role.replace('_', ' ')}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
