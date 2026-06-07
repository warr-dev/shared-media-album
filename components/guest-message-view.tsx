"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function GuestMessageView({
  shareSlug,
  eventName = "wedding",
}: {
  shareSlug: string;
  eventName?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    // Simulate sending network request
    setTimeout(() => {
      // Save to localStorage as a placeholder mock
      const existing = localStorage.getItem(`guest_wishes_${shareSlug}`) || "[]";
      try {
        const wishes = JSON.parse(existing);
        wishes.push({
          message: message.trim(),
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem(`guest_wishes_${shareSlug}`, JSON.stringify(wishes));
      } catch (err) {
        console.error("Failed to save wish", err);
      }

      setIsSending(false);
      setIsSent(true);
      setMessage("");
    }, 800);
  }

  return (
    <section className="guest-screen mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#e9e9e9] text-[#034326] shadow-sm flex flex-col">
      {/* Top Background Banner Area */}
      <div className="relative h-[25vh] w-full shrink-0 overflow-hidden bg-[#7f7b74]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-[2px]"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop')" 
          }}
        />
        <div className="absolute inset-0 bg-black/45" />
        
        {/* Top-Left Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            className="guest-pressable inline-flex items-center gap-2 bg-black border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md"
            href={`/a/${shareSlug}?view=upload`}
          >
            <ChevronLeft className="h-4 w-4" />
            back
          </Link>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="guest-panel-rise flex-1 -mt-6 rounded-t-[22px] bg-white px-6 pb-8 pt-8 flex flex-col">
        {!isSent ? (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <h1 className="text-[22px] font-bold text-center leading-snug text-[#034326]">
              Leave a message, memory, or well wishes for the happy couple.
            </h1>
            <p className="mt-3 text-sm text-[#555] text-center px-2">
              Please include your name so we know who it's from. Don't worry only the couple can see your message.
            </p>

            {/* Textarea Container */}
            <div className="mt-6 flex-1 flex flex-col">
              <textarea
                className="w-full flex-1 min-h-[200px] p-4 rounded-xl border border-gray-200 bg-[#fafafa] text-black placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#7fa08e] focus:border-transparent transition-all resize-none"
                placeholder="Type your message here for the couple."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
                required
              />
            </div>

            {/* Send Button */}
            <button
              className="guest-pressable mt-6 w-full h-14 rounded-xl bg-gradient-to-r from-[#7fa08e] to-[#a9cfbd] text-white font-bold text-lg shadow-md flex items-center justify-center disabled:opacity-75"
              type="submit"
              disabled={isSending || !message.trim()}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center py-8">
            <div className="h-16 w-16 bg-[#e6f4ea] text-[#137333] rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#034326]">Message Sent!</h2>
            <p className="mt-3 text-sm text-[#555] max-w-[280px]">
              Thank you for sharing your warm wishes! The couple will be able to see your message in their manager dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-3 w-full">
              <button
                className="guest-pressable w-full h-12 rounded-xl bg-[#7fa08e] text-white font-bold text-sm"
                onClick={() => setIsSent(false)}
              >
                Write Another Message
              </button>
              <Link
                className="guest-pressable w-full h-12 rounded-xl bg-gray-100 text-[#034326] font-bold text-sm flex items-center justify-center"
                href={`/a/${shareSlug}?view=upload`}
              >
                Back to Photos
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
