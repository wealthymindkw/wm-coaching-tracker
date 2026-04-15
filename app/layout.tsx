import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WM Coaching Tracker",
  description: "Wealthy Mind — Coach Steps Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" className="dark">
      <body>{children}</body>
    </html>
  );
}
