// src/components/layout/PageContainer.jsx
import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const PageContainer = ({
  children,
  maxWidth = '1400px',
  hideSidebar = false
}) => {
  return (
    <div className="stitch-app-shell">
      <Navbar />
      <div className="stitch-body">
        {!hideSidebar && <Sidebar />}
        <main className="stitch-canvas custom-scroll">
          <div className="stitch-content-container" style={{ maxWidth }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
