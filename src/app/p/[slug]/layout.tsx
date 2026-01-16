import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function PublicProfileLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
