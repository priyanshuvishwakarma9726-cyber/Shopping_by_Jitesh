import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/context/toast-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { Header } from '@/components/layout/Header';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { PWAInstaller } from '@/components/pwa/PWAInstaller';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Shopping by Jitesh | Multi-Category E-Commerce Marketplace',
  description:
    'Explore curated electronics, apparel, horology, home living, and beauty. Quality products delivered directly to your doorstep across India.',
  keywords: ['Shopping by Jitesh', 'E-commerce Marketplace', 'Electronics', 'Fashion', 'Home Living', 'India'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shopping by Jitesh',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-stone-50 text-slate-900 pb-20 md:pb-0" suppressHydrationWarning>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <CartDrawer />
              <main className="flex-1">{children}</main>
              <Footer />
              <MobileNav />
              <PWAInstaller />
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
