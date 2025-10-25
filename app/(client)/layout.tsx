import Header from "@/components/ui/Header";
import type { Metadata } from "next";
import "../globals.css";
import Footer from "@/components/Footer";
import {ClerkProvider} from "@clerk/nextjs"


export const metadata: Metadata = {
  title: "Pluto shopping store",
  description: "Pluto shopping store,the best quality assured products for you",
};

export default function RootLayout({ children, }:Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
        <div className="flex flex-col min-h-screen">
          <Header/>
          <main className="flex-1">
            {children}
          </main>
          <Footer/>
        </div>
    </ClerkProvider>
  );
}
