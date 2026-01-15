'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

/**
 * Conditionally renders Header and Footer based on the current route.
 * Admin routes (/admin) should not show the main site Header/Footer.
 */
export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Header />}
      <main id="content" className="flex-1">
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}

