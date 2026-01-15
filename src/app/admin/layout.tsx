import { ReactNode } from 'react';
import { Metadata } from 'next';

/**
 * Admin Layout Metadata
 * 
 * SECURITY: These settings ensure the admin panel is:
 * - Not indexed by search engines
 * - Not cached by browsers
 * - Not archived by web crawlers
 */
export const metadata: Metadata = {
  title: 'Admin Panel | Chariotek',
  description: 'Protected administrative area',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

/**
 * Admin Layout Component
 * 
 * This layout wraps all admin pages and provides:
 * - Separate styling from main site
 * - Security-focused metadata (noindex)
 * - Clean, minimal container
 * 
 * Note: Header and Footer are automatically hidden for admin routes
 * via ConditionalLayout in the root layout.
 */
export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
