export default function ShareAlbumLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:px-6">
        {children}
      </div>
    </main>
  );
}
