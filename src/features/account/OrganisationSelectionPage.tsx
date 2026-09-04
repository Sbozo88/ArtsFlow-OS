import { Navigate, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveOrganisation } from '../../contexts/ActiveOrganisationContext';

const roleLabel = (role: string) => role.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');

export function OrganisationSelectionPage() {
  const navigate = useNavigate();
  const { user, authUser, loading } = useAuth();
  const { activeOrganisationId, availableOrganisations, switchOrganisation, setDefaultOrganisation, isResolvingOrganisation } = useActiveOrganisation();
  if (loading || isResolvingOrganisation) return <div className="min-h-screen grid place-items-center">Resolving organisations…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (activeOrganisationId) return <Navigate to="/" replace />;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">Choose an organisation</h1>
        <p className="mt-2 text-sm text-slate-600">Your role and available features are resolved separately for each organisation.</p>
        {availableOrganisations.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <p className="font-medium text-slate-900">No active organisation memberships</p>
            <p className="mt-1 text-sm text-slate-600">Ask an organisation administrator to invite you, or use the platform console if you are a platform administrator.</p>
            {authUser?.platformRole === 'super_admin' && <button onClick={() => navigate('/platform')} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Open platform console</button>}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableOrganisations.map(({ organisation, membership }) => (
              <article key={organisation.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <Building2 className="h-8 w-8 text-indigo-600" />
                <h2 className="mt-4 font-semibold text-slate-900">{organisation.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{roleLabel(String(membership.role))}</p>
                <button onClick={async () => { await switchOrganisation(organisation.id); navigate('/dashboard', { replace: true }); }} className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Open</button>
                <button onClick={() => setDefaultOrganisation(organisation.id)} className="mt-2 w-full rounded-lg px-4 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50">Set as my default</button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
