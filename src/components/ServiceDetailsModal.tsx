import { X, Check, XCircle } from 'lucide-react';
import { PricingTier } from '../types';

interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: PricingTier;
  serviceName: string;
}

const ServiceDetailsModal = ({ isOpen, onClose, tier, serviceName }: ServiceDetailsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl">
          <div className="w-8" />
          <div className="w-12 h-1.5 bg-gray-300 rounded-full md:hidden" />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {tier.name} Service
            </h2>
            <p className="text-gray-600">{serviceName}</p>
          </div>

          {tier.included && tier.included.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                The expert is trained to
              </h3>
              <div className="space-y-3">
                {tier.included.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check size={16} className="text-white" strokeWidth={3} />
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tier.notIncluded && tier.notIncluded.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                What is not included
              </h3>
              <div className="space-y-3">
                {tier.notIncluded.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <XCircle size={24} className="text-orange-500" strokeWidth={2} />
                    </div>
                    <p className="text-gray-700 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3 border border-gray-200">
            <div className="text-2xl flex-shrink-0">🧹</div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Please provide all necessary equipment for the expert
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsModal;
