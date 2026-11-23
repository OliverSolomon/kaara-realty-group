"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAppStore } from "@canvix/store/app-store";
import type { DesignRecord } from "@canvix/lib/types";
import ShareDialog from "@/app/admin/(panel)/ShareDialog";

const Editor = dynamic(() => import("@canvix/components/editor/Editor"), {
  ssr: false,
  loading: () => <p style={{ padding: 32, color: "#0e1318" }}>Opening your design…</p>,
});

export default function StudioClient({ design, canShare }: { design: { id: string; name: string } & Record<string, unknown>; canShare: boolean }) {
  // The editor reads the open design from its store on first mount.
  useState(() => {
    useAppStore.setState({ view: "editor", pendingDesign: design as unknown as DesignRecord });
    return null;
  });
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    const open = () => setSharing(true);
    window.addEventListener("kaara:share-design", open);
    return () => window.removeEventListener("kaara:share-design", open);
  }, []);
  return (
    <div className={canShare ? "kaara-can-share" : undefined} style={{ height: "100dvh" }}>
      <Editor />
      {canShare && sharing && (
        <ShareDialog kind="design" itemId={design.id} title={design.name} link={`${window.location.origin}/design-studio/${design.id}`} onClose={() => setSharing(false)} />
      )}
    </div>
  );
}
