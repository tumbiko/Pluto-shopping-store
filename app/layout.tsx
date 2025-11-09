// app/layout.tsx
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { GoogleAnalytics } from 'nextjs-google-analytics';
import { Analytics } from '@vercel/analytics/react'; // ✅ import Vercel Analytics

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="font-poppins antialiased">
        {/* Google Analytics */}
        <GoogleAnalytics
          trackPageViews
          gaMeasurementId={process.env.NEXT_PUBLIC_GA_ID}
        />

        {/* Your app content */}
        {children}

        {/* Toast notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#000000', color: '#fff' },
          }}
        />

        {/* ✅ Add Vercel Analytics here */}
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
