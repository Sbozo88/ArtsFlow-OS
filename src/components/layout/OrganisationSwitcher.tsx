import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveOrganisation } from '../../contexts/ActiveOrganisationContext';

function roleLabel(role: string): string {
  return role.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
}

export function OrganisationSwitcher() {
  const navigate = useNavigate();
  const {
    activeOrganisation, activeMembershipRole, availableOrganisations,
    switchOrganisation, isSwitchingOrganisation, organisationError
  } = useActiveOrganisation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  if (!activeOrganisation) return null;
  if (availableOrganisations.length <= 1) {
    return <span className="text-sm font-semibold text-slate-700 truncate max-w-[190px]">{activeOrganisation.name}</span>;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={isSwitchingOrganisation}
        className="flex max-w-[230px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
      >
        <Building2 className="h-4 w-4 shrink-0 text-indigo-600" />
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-slate-800">{activeOrganisation.name}</span>
          <span className="block truncate text-[10px] text-slate-500">{activeMembershipRole ? roleLabel(activeMembershipRole) : ''}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div role="menu" className="absolute left-0 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl z-50">
          <div className="max-h-80 overflow-y-auto p-1.5">
            {availableOrganisations.map(({ organisation, membership }) => {
              const current = organisation.id === activeOrganisation.id;
              return (
                <button
                  key={organisation.id}
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    if (current) return setOpen(false);
                    try {
                      await switchOrganisation(organisation.id);
                      setOpen(false);
                      navigate('/', { replace: true });
                    } catch { /* Context retains the current valid organisation. */ }
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  <Building2 className="h-5 w-5 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{organisation.name}</span>
                    <span className="block text-xs text-slate-500">
                      {roleLabel(String(membership.role))}{organisation.tenantStatus && organisation.tenantStatus !== 'active' ? ` · ${roleLabel(organisation.tenantStatus)}` : ''}
                    </span>
                  </span>
                  {current && <Check className="h-4 w-4 text-indigo-600" aria-label="Current organisation" />}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/account/organisations'); }}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <Settings className="h-4 w-4" /> Manage organisations
          </button>
          {organisationError && <p className="border-t border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">{organisationError}</p>}
        </div>
      )}
    </div>
  );
}
