import './globals.css'
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="font-poppins antialiased">
        
        {/* Your app content */}
        {children}
         <Analytics />
        {/* Toast notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#000000', color: '#fff' },
          }}
        />
      </body>
    </html>
  );
};

export default RootLayout;
