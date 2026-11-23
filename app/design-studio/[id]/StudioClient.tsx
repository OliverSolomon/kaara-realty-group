"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useAppStore } from "@canvix/store/app-store";
import type { DesignRecord } from "@canvix/lib/types";

const Editor = dynamic(() => import("@canvix/components/editor/Editor"), {
  ssr: false,
  loading: () => <p style={{ padding: 32, color: "#efebe3" }}>Opening your design…</p>,
});

export default function StudioClient({ design }: { design: unknown }) {
  // The editor reads the open design from its store on first mount.
  useState(() => {
    useAppStore.setState({ view: "editor", pendingDesign: design as DesignRecord });
    return null;
  });
  return (
    <div style={{ height: "100dvh" }}>
      <Editor />
    </div>
  );
}
