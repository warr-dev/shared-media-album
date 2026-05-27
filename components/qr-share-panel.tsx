"use client";

import QRCode from "qrcode";
import { Copy, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function QrSharePanel({
  eventId,
  link,
  permissions
}: {
  eventId: string;
  link: string;
  permissions: string[];
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState(link);

  useEffect(() => {
    QRCode.toDataURL(shareLink, { margin: 1, width: 220 }).then(setQrCodeUrl);
  }, [shareLink]);

  async function regenerate() {
    const response = await fetch(`/api/events/${eventId}/share`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ permissions })
    });

    if (response.ok) {
      const data = (await response.json()) as { link: string; qrCodeUrl: string };
      setShareLink(data.link);
      setQrCodeUrl(data.qrCodeUrl);
    }
  }

  return (
    <section className="grid gap-4 rounded-md border border-border bg-card p-4">
      <div>
        <h2 className="text-lg font-semibold">Share link</h2>
        <p className="text-sm text-muted-foreground">QR access can be regenerated or revoked later.</p>
      </div>
      {qrCodeUrl ? (
        <Image
          alt="Event album QR code"
          className="h-44 w-44 rounded-md border border-border"
          height={176}
          src={qrCodeUrl}
          unoptimized
          width={176}
        />
      ) : null}
      <div className="flex min-w-0 gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          readOnly
          value={shareLink}
        />
        <button
          aria-label="Copy share link"
          className="button-secondary h-10 w-10 px-0"
          onClick={() => navigator.clipboard.writeText(shareLink)}
          type="button"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button aria-label="Regenerate share link" className="button-secondary h-10 w-10 px-0" onClick={regenerate} type="button">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
