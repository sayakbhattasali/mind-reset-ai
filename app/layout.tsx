import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindReset AI - 90-second physiological de-escalation coach",
  description: "90-second physiological de-escalation coach for anxiety, substance urges, screen addiction, and stress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#05070B] text-white">
      <body className="font-sans antialiased bg-[#05070B] text-white min-h-screen selection:bg-emerald-500/30">
        {children}
      </body>
    </html>
  );
}
