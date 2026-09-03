import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
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
