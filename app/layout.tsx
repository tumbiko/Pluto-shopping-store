import './globals.css'
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from "@/components/ui/theme-provider"

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-poppins antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          {/* Toast notifications (inside theme so toast styles can follow theme) */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#000000', color: '#fff' },
            }}
          />

          {/* Analytics can be inside or outside theme; inside is fine */}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
