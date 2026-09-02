import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../hooks/useEvents';
import { useEventTransportPlans } from '../../hooks/useEventTransportPlans';
import { documentGenerationService } from '../../services/documentGenerationService';
import { 
  FileCode, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  Bus, 
  Users, 
  FileCheck 
} from 'lucide-react';

type GeneratorType = 'running_order' | 'transport_manifest' | 'participant_roster' | 'consent_summary';

export const GeneratedDocumentsPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const { events } = useEvents();
  const { plans } = useEventTransportPlans();

  const [generatorType, setGeneratorType] = useState<GeneratorType>('running_order');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [saveAsDoc, setSaveAsDoc] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;

    setGenerating(true);
    setError(null);
    setPreviewHtml(null);
    setCreatedDocId(null);

    try {
      let res: { html: string; document?: { id: string } };

      if (generatorType === 'running_order') {
        if (!selectedEventId) throw new Error('Please select an event.');
        res = await documentGenerationService.generateEventRunningOrder(
          organisationId,
          selectedEventId,
          saveAsDoc,
          user?.uid || 'user'
        );
      } else if (generatorType === 'transport_manifest') {
        if (!selectedPlanId) throw new Error('Please select a transport plan.');
        res = await documentGenerationService.generateTransportManifest(
          organisationId,
          selectedPlanId,
          saveAsDoc,
          user?.uid || 'user'
        );
      } else if (generatorType === 'participant_roster') {
        if (!selectedEventId) throw new Error('Please select an event.');
        res = await documentGenerationService.generateParticipantList(
          organisationId,
          selectedEventId,
          saveAsDoc,
          user?.uid || 'user'
        );
      } else {
        if (!selectedEventId) throw new Error('Please select an event.');
        res = await documentGenerationService.generateConsentSummary(
          organisationId,
          selectedEventId,
          saveAsDoc,
          user?.uid || 'user'
        );
      }

      setPreviewHtml(res.html);
      if (res.document) {
        setCreatedDocId(res.document.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!previewHtml) return;
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(previewHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileCode className="w-7 h-7 text-indigo-600" /> Operational Document Generator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate printable HTML and PDF-ready manifests, running orders, rosters, and compliance summaries.
        </p>
      </div>

      {/* Generator Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
        {/* Generator Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => { setGeneratorType('running_order'); setPreviewHtml(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              generatorType === 'running_order'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs ring-2 ring-indigo-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <Calendar className={`w-5 h-5 mb-2 ${generatorType === 'running_order' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <h3 className="font-bold text-xs text-slate-900">Event Running Order</h3>
            <p className="text-2xs text-slate-500 mt-0.5">Schedule, stages, and performance pieces.</p>
          </button>

          <button
            type="button"
            onClick={() => { setGeneratorType('transport_manifest'); setPreviewHtml(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              generatorType === 'transport_manifest'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs ring-2 ring-indigo-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <Bus className={`w-5 h-5 mb-2 ${generatorType === 'transport_manifest' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <h3 className="font-bold text-xs text-slate-900">Passenger Manifest</h3>
            <p className="text-2xs text-slate-500 mt-0.5">Boarding checklist, seats & pickup points.</p>
          </button>

          <button
            type="button"
            onClick={() => { setGeneratorType('participant_roster'); setPreviewHtml(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              generatorType === 'participant_roster'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs ring-2 ring-indigo-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <Users className={`w-5 h-5 mb-2 ${generatorType === 'participant_roster' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <h3 className="font-bold text-xs text-slate-900">Participant Roster</h3>
            <p className="text-2xs text-slate-500 mt-0.5">Alphabetical learner participant sheet.</p>
          </button>

          <button
            type="button"
            onClick={() => { setGeneratorType('consent_summary'); setPreviewHtml(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              generatorType === 'consent_summary'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs ring-2 ring-indigo-600/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <FileCheck className={`w-5 h-5 mb-2 ${generatorType === 'consent_summary' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <h3 className="font-bold text-xs text-slate-900">Consent Summary</h3>
            <p className="text-2xs text-slate-500 mt-0.5">Approved vs missing legal permissions.</p>
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Conditional Input */}
          {generatorType !== 'transport_manifest' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Event *</label>
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="">-- Choose Event --</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name} ({ev.startDate})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Transport Plan *</label>
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="">-- Choose Transport Plan --</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.planName} ({p.departureDate})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="saveAsDoc"
              checked={saveAsDoc}
              onChange={e => setSaveAsDoc(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="saveAsDoc" className="text-xs text-slate-700 font-medium">
              Save a permanent copy to the Documents repository
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={generating}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <FileCode className="w-4 h-4" />
              {generating ? 'Generating...' : 'Generate Document'}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Output Preview */}
      {previewHtml && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-800 text-sm">Document Successfully Generated</span>
              {createdDocId && (
                <span className="px-2 py-0.5 text-2xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                  Saved to Documents Hub
                </span>
              )}
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>

          <div className="p-6 bg-slate-100 flex justify-center">
            <div className="bg-white shadow-md rounded-lg max-w-3xl w-full p-8 border border-slate-200">
              <iframe
                title="Generated Preview"
                srcDoc={previewHtml}
                className="w-full min-h-[500px] border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
