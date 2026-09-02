import { useState } from 'react';
import { X, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { BUILT_IN_TEMPLATES } from '../../../services/automation/automationRuleService';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => Promise<void>;
}

export function TemplateGalleryModal({ isOpen, onClose, onSelectTemplate }: TemplateGalleryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [instantiatingId, setInstantiatingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'attendance', name: 'Attendance' },
    { id: 'finance', name: 'Finance' },
    { id: 'consent', name: 'Consent' },
    { id: 'event', name: 'Events' },
    { id: 'transport', name: 'Transport' },
    { id: 'instrument', name: 'Instruments' },
    { id: 'costume', name: 'Costumes' },
    { id: 'follow_up', name: 'Follow-Ups' },
    { id: 'communication', name: 'Communication' }
  ];

  const filteredTemplates = BUILT_IN_TEMPLATES.filter(
    tpl => selectedCategory === 'all' || tpl.ruleCategory === selectedCategory
  );

  const handleInstantiate = async (templateId: string) => {
    try {
      setInstantiatingId(templateId);
      await onSelectTemplate(templateId);
      onClose();
    } finally {
      setInstantiatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Automation Rule Templates</h2>
              <p className="text-xs text-slate-300">
                Pre-configured, safe operational rules adhering to strict human-in-the-loop policies.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="p-6 max-h-[65vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map(tpl => (
            <div
              key={tpl.templateId}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                    {tpl.ruleCategory}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    Dedup: {tpl.deduplicationWindowHours}h
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{tpl.name}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                  {tpl.description}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    {tpl.actions.length} action(s): {tpl.actions.map(a => a.actionType.replace(/_/g, ' ')).join(', ')}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <button
                  onClick={() => handleInstantiate(tpl.templateId)}
                  disabled={instantiatingId === tpl.templateId}
                  className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {instantiatingId === tpl.templateId ? (
                    'Activating...'
                  ) : (
                    <>
                      <span>Activate Template</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
