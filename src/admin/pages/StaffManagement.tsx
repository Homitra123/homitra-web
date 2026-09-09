import { UserCog } from 'lucide-react';

const StaffManagement = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 lg:p-12 text-center">
        <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <UserCog className="h-8 w-8 text-sky-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">Staff Management</h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          The full staff-management tools are being finalised and will appear here shortly.
        </p>
      </div>
    </div>
  );
};

export default StaffManagement;
