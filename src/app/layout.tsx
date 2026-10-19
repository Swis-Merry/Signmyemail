import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Email signature manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-800 antialiased">{children}</body>
    </html>
  );
}
