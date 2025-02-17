import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from '@/contexts/CartContext';


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
      <CartProvider>
        {children}
        </CartProvider>
        <Toaster /> {/* Di chuyển Toaster vào cuối body */}
      </body>
    </html>
  );
}
