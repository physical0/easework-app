import type { ReactNode } from 'react';
import Navigation from '../Navigation/Navigation';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Navigation />
      <main className="main-content">{children}</main>
      <footer className="nav-container">
        <div className="nav-content text-center">
          <p>© {new Date().getFullYear()} Easework. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}