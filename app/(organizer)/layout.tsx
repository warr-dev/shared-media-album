import Link from "next/link";

import { AuthNav } from "@/components/auth-nav";

export default function OrganizerLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link className="text-sm font-semibold" href="/events">
            Shared Media Album
          </Link>
          <div className="flex items-center gap-2">
            <AuthNav />
          </div>
        </nav>
      </header>
      {children}
    </main>
  );
}
