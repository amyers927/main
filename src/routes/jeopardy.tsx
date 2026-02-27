import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

const JeopardyTerminal = React.lazy(async () => {
  const mod = await import("../components/JeopardyTerminal");
  return { default: mod.JeopardyTerminal };
});

export const Route = createFileRoute("/jeopardy")({
  component: JeopardyPage,
});

function JeopardyPage() {
  return (
    <div className="p-6">
      <React.Suspense fallback={<p className="text-sm text-black/60">Loading Jeopardy...</p>}>
        <JeopardyTerminal />
      </React.Suspense>
    </div>
  );
}
