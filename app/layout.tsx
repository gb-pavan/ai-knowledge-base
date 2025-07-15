import './globals.css';
import type { Metadata } from 'next/content';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Navbar } from '@/components/navigation/navbar';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Knowledge Base - Intelligent FAQ Assistant',
  description: 'AI-powered knowledge base and FAQ bot with intelligent answers, role-based authentication, and comprehensive admin dashboard.',
  keywords: 'AI, knowledge base, FAQ, chatbot, artificial intelligence, help desk',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}