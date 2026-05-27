import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Shared Media Album",
  description: "Private event albums for guest photo and video sharing."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
