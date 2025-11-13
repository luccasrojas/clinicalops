'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, FileText, Users, Settings, Mic, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AnimatePresence, motion } from 'motion/react';

type NavItem = {
  name: string;
  href: string;
  icon: typeof Home;
};

type SidebarContentProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
  navItems: NavItem[];
  pathname: string | null;
  onNewRecording: () => void;
  onLogout: () => void;
};

function SidebarContent({ user, navItems, pathname, onNewRecording, onLogout }: SidebarContentProps) {
  return (
    <>
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-base md:text-lg">
            {user.name?.charAt(0) || 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.name || 'Doctor'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 md:p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-teal-500/10 text-teal-600'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 md:p-4 border-t border-border">
        <Button
          onClick={onNewRecording}
          className="w-full bg-teal-500 hover:bg-teal-600"
          size="lg"
        >
          <Mic className="w-5 h-5 mr-2" />
          Nueva Grabación
        </Button>
      </div>

      <div className="p-3 md:p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHasHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }
    const frame = requestAnimationFrame(() => setIsMobileMenuOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname, isMobileMenuOpen]);

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Historias Clínicas',
      href: '/dashboard/historias',
      icon: FileText,
    },
    {
      name: 'Pacientes',
      href: '/dashboard/pacientes',
      icon: Users,
    },
    {
      name: 'Configuración',
      href: '/dashboard/configuracion',
      icon: Settings,
    },
  ];

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user.name?.charAt(0) || 'D'}
            </div>
            <span className="font-semibold text-base">ClinicalOps</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
            />

            {/* Sliding Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-16 bottom-0 z-50 w-72 bg-card border-r border-border flex flex-col"
            >
              <SidebarContent
                user={user}
                navItems={navItems}
                pathname={pathname}
                onNewRecording={() => router.push('/dashboard/grabacion')}
                onLogout={logout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 bg-card border-r border-border flex-col shrink-0">
        <SidebarContent
          user={user}
          navItems={navItems}
          pathname={pathname}
          onNewRecording={() => router.push('/dashboard/grabacion')}
          onLogout={logout}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
