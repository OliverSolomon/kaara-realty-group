"use client";

export default function AdminError({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return (
    <div role="alert" className="border border-white/10 bg-[#171232] px-6 py-14 text-center">
      <h1 className="font-serif text-2xl">The lead inbox could not load</h1>
      <p className="mt-2 text-sm text-white/55">No leads were lost. The database may be waking up.</p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="press mt-6 min-h-11 border border-[#4f9d8f] bg-[#2e7d6f] px-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4faf8]"
      >
        Try again
      </button>
    </div>
  );
}
