import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-slate-400 mb-8">
          You don't have permission to access the admin console. If you believe
          this is an error, contact a super administrator.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          <ShieldCheck size={18} />
          Back to site
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
