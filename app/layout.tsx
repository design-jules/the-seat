import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import NavWrapper from "@/components/NavWrapper";
import Footer from "@/components/Footer";
import { PHProvider } from "./providers";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "The Seat",
  description: "Design from the seat that matters. Upload your training, pick a learner, hear what they're actually thinking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${interTight.variable} antialiased`}>
        <PHProvider>
          <NavWrapper />
          {children}
          <Footer />
        </PHProvider>
      </body>
    </html>
  );
}
