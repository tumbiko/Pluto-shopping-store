// app/layout.tsx
import React from 'react';
import { Toaster } from 'react-hot-toast';

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="font-poppins antialiased">
        
        {/* Your app content */}
        {children}

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
