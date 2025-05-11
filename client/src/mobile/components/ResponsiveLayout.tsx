import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import Layout from '@/components/layout/Layout';
import MobileHeader from './MobileHeader';
import MobileNavbar from './MobileNavbar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function ResponsiveLayout({
  children,
  title,
  showBackButton = false,
  onBack
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <MobileHeader 
          title={title} 
          showBackButton={showBackButton} 
          onBack={onBack} 
        />
        <main className="flex-1 px-4 py-4 pb-20 overflow-auto">
          {children}
        </main>
        <MobileNavbar />
      </div>
    );
  }

  return (
    <Layout>
      {children}
    </Layout>
  );
}