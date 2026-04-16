import { X, HelpCircle, Mail, Phone } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const HelpSupportPanel = ({ onClose }: Props) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[calc(100dvh-5rem)] sm:max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <HelpCircle size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Help & Support</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-8 space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={28} className="text-blue-600" />
            </div>
            <p className="text-gray-700 text-base leading-relaxed">
              We're always here for you — your comfort and satisfaction are at the heart of everything we do at Homitra.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="mailto:support@homitra.co.in"
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                <Mail size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Email us</p>
                <p className="font-semibold text-gray-900">support@homitra.co.in</p>
              </div>
            </a>

            <a
              href="tel:+919008935455"
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                <Phone size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">Call us</p>
                <p className="font-semibold text-gray-900">+91 90089 35455</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportPanel;
