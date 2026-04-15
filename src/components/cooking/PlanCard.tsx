import { Check } from 'lucide-react';
import { CookingPlan } from '../../data/cookingPlans';

interface PlanCardProps {
  plan: CookingPlan;
  onSelect: (planId: string) => void;
}

const PlanCard = ({ plan, onSelect }: PlanCardProps) => {
  return (
    <button
      onClick={() => onSelect(plan.id)}
      className={`
        group relative text-left transition-all duration-200
        border-[4px] rounded-xl
        bg-gray-50 border-gray-300
        hover:border-orange-400 hover:shadow-xl hover:bg-white
        md:row-span-4 md:grid md:[grid-template-rows:subgrid]
        flex flex-col
      `}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-5 z-10">
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="px-6 pt-7 pb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug">{plan.name}</h3>
        <p className="text-sm text-orange-600 font-medium">{plan.tagline}</p>
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          What's included:
        </h4>
        <ul className="space-y-1.5">
          {plan.included.map((item, idx) => {
            const parts = item.split('\n');
            return (
              <li key={idx} className="flex items-start gap-2 text-xs text-gray-800 font-medium">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={9} className="text-white" strokeWidth={3} />
                </div>
                {parts.length > 1 ? (
                  <div className="leading-relaxed">
                    {parts.map((part, pIdx) => (
                      <div key={pIdx}>
                        <span>{part}</span>
                        {pIdx < parts.length - 1 && (
                          <div className="flex items-center gap-2 my-1.5">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-200" />
                            <span className="text-[9px] font-semibold text-orange-400 tracking-[0.2em] uppercase px-1">or</span>
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-200" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span>{item}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          What's not included:
        </h4>
        <ul className="space-y-1.5">
          {plan.notIncluded.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-gray-800 font-medium">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">✕</span>
              </div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 mt-auto md:mt-0">
        <span className="text-sm font-semibold text-orange-600 group-hover:text-orange-700 transition-colors">
          Select this plan →
        </span>
      </div>
    </button>
  );
};

export default PlanCard;
