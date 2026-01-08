import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="md:ml-64 transition-all duration-300">
        <Header />
        <main className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
