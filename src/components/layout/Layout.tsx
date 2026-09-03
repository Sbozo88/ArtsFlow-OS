import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';
import { useActiveOrganisation } from '../../contexts/ActiveOrganisationContext';

export function Layout() {
  const { isSwitchingOrganisation, activeOrganisation } = useActiveOrganisation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isSwitchingOrganisation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90" role="status" aria-live="polite">
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 shadow-lg">
            Switching organisation{activeOrganisation?.name ? ` from ${activeOrganisation.name}` : ''}…
          </div>
        </div>
      )}
      {/* Skip-to-content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-200',
          // Desktop: offset by sidebar width
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64',
          // Mobile: no margin
          'ml-0'
        )}
      >
        <Header onMenuToggle={() => setMobileMenuOpen(true)} />
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
