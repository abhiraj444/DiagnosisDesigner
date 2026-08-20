import type { Metadata } from 'next';
import './globals.css';
import { Plus_Jakarta_Sans, Caveat, JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const handwritingFont = Caveat({
  subsets: ['latin'],
  variable: '--font-handwriting',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MediGen: Clinical Journal & AI Studio',
  description:
    'Handwritten clinical notes, differential diagnosis, and medical teaching slide generator for MBBS & PG residents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen font-sans antialiased selection:bg-amber-200 selection:text-amber-900 dark:selection:bg-amber-900/50 dark:selection:text-amber-100',
          sansFont.variable,
          handwritingFont.variable,
          monoFont.variable
        )}
      >
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col bg-background text-foreground">
                <Header />
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

