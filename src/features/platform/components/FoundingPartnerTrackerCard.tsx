import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Lock, Clock } from 'lucide-react';
import type { Organisation } from '../../../types';

interface FoundingPartnerTrackerCardProps {
  organisations: Organisation[];
  onAssignSlot?: (slotNumber: number) => void;
}

export const FoundingPartnerTrackerCard: React.FC<FoundingPartnerTrackerCardProps> = ({
  organisations
}) => {
  // Map founding partners by their assigned partner number (1 to 10)
  const foundingPartners = organisations.filter(
    (o) => o.isFoundingPartner && o.foundingPartnerStatus !== 'declined' && o.foundingPartnerStatus !== 'withdrawn'
  );

  const slotMap = new Map<number, Organisation>();
  foundingPartners.forEach((org) => {
    if (org.foundingPartnerNumber) {
      slotMap.set(org.foundingPartnerNumber, org);
    }
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            First 10 Founding Partner Roster
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {foundingPartners.length} of 10 Slots Committed
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {Array.from({ length: 10 }).map((_, index) => {
          const slotNumber = index + 1;
          const partner = slotMap.get(slotNumber);

          if (partner) {
            const isConverted = partner.foundingPartnerStatus === 'converted' || partner.tenantStatus === 'active';
            return (
              <Link
                key={slotNumber}
                to={`/platform/organisations/${partner.id}`}
                className="group p-3 rounded-xl border bg-slate-800/80 hover:bg-slate-800 border-indigo-500/40 hover:border-indigo-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-mono font-bold text-indigo-400">
                      #{slotNumber.toString().padStart(2, '0')}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        isConverted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {partner.foundingPartnerStatus || 'trial'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                    {partner.name}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="capitalize">{partner.assignedPlanId?.replace('plan_', '') || 'pro'}</span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Lock className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Locked</span>
                  </div>
                </div>
              </Link>
            );
          }

          return (
            <div
              key={slotNumber}
              className="p-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-[11px] font-bold text-slate-600">
                  #{slotNumber.toString().padStart(2, '0')}
                </span>
                <div className="text-xs font-medium text-slate-500 mt-1">Available Slot</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-600 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>Reserved for Pilot</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
