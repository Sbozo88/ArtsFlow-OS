import React from 'react';
import { Database, ShieldAlert } from 'lucide-react';
import { useActiveOrganisation } from '../../contexts/ActiveOrganisationContext';

export function DemoTenantBanner(): React.ReactNode {
  const { activeOrganisation } = useActiveOrganisation();

  if (!activeOrganisation) return null;

  const isTkmDemo =
    activeOrganisation.id === 'org_demo_tkm' ||
    activeOrganisation.name?.toLowerCase().includes('tkm') ||
    activeOrganisation.name?.toLowerCase().includes('thabang');

  const isDemo = activeOrganisation.isDemoTenant || activeOrganisation.id === 'org_demo_artsflow' || isTkmDemo;

  if (!isDemo) return null;

  return (
    <aside
      aria-label="Demo Environment Notice"
      className="relative z-20 border-b border-amber-300 bg-amber-50 px-4 py-2.5 sm:px-6 shadow-sm text-amber-950"
    >
      <div className="mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-7xl">
        <div className="flex items-start md:items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-200 border border-amber-400 font-bold text-xs uppercase tracking-wider text-amber-900 shrink-0">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            INTERNAL DEMO
          </div>
          <div className="text-xs sm:text-sm">
            {isTkmDemo ? (
              <div>
                <strong className="font-semibold text-amber-900 mr-2">TKM DEMO DATASET</strong>
                <span className="text-amber-800">
                  Based on current consolidated operational register (46 records). The broader TKM registry reconciliation target is 77 unique learners. This demo dataset must not be treated as the final verified live TKM registry.
                </span>
              </div>
            ) : (
              <div>
                <strong className="font-semibold text-amber-900 mr-2">DEMO DATA TENANT</strong>
                <span className="text-amber-800">
                  This organisation is an isolated demonstration environment populated with fictional or pilot records for internal validation.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 text-xs text-amber-700 font-medium">
          <Database className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Non-Commercial / Pilot Safe</span>
        </div>
      </div>
    </aside>
  );
}
