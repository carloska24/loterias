import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans print:bg-white print:min-h-0">
      <div className="hidden md:block print:hidden">
        <Sidebar />
      </div>
      <div className="md:ml-64 transition-all duration-300 print:ml-0 print:block">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="p-4 md:p-8 print:p-0 print:m-0">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};
