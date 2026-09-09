import { ShieldCheck, Construction } from 'lucide-react';

const AdminHome = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 lg:p-12 text-center">
        <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="h-8 w-8 text-sky-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          Admin Foundation Online
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto mb-8">
          The operator console is up and running. Additional modules â orders,
          customers, finance, and more â will appear here as they are built.
        </p>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Construction size={16} />
          <span>More modules coming soon</span>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
