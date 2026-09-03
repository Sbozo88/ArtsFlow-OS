import { Check, Star } from 'lucide-react';
import { useActiveOrganisation } from '../../contexts/ActiveOrganisationContext';

const roleLabel = (role: string) => role.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');

export function MyOrganisationsPage() {
  const { activeOrganisationId, availableOrganisations, switchOrganisation, setDefaultOrganisation } = useActiveOrganisation();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">My Organisations</h1>
      <p className="mt-2 text-sm text-slate-600">Your memberships and roles. Roles can only be changed by an organisation administrator.</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {availableOrganisations.map(({ organisation, membership }) => (
          <div key={membership.id} className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{organisation.name}</p>
              <p className="text-sm text-slate-500">{roleLabel(String(membership.role))} · {roleLabel(membership.membershipStatus)}</p>
            </div>
            {membership.isDefaultOrganisation && <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><Star className="h-3.5 w-3.5 fill-current" /> Default</span>}
            <div className="flex gap-2">
              {!membership.isDefaultOrganisation && <button onClick={() => setDefaultOrganisation(organisation.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50">Make default</button>}
              <button disabled={activeOrganisationId === organisation.id} onClick={() => switchOrganisation(organisation.id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-200 disabled:text-slate-500">
                {activeOrganisationId === organisation.id ? <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Current</span> : 'Switch'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
