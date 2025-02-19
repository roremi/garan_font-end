import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cục Tác Chicken",
  description: "Thương hiệu gà rán số 1 Việt Nam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
        </AuthProvider>
        <Toaster 
          position="top-center" 
          richColors 
          closeButton
          theme="light"
          toastOptions={{
            // Tùy chỉnh style mặc định cho toast
            style: {
              background: 'white',
              color: 'black',
            },
            // Thời gian hiển thị mặc định
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
