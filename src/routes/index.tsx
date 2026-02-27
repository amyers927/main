import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GinRummyPanel } from "../components/GinRummyPanel";
import { JeopardyTerminal } from "../components/JeopardyTerminal";

export const Route = createFileRoute("/")({
  component: Home,
});

type TabKey = "about" | "resume" | "gallery" | "gin_rummy" | "jeopardy";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "about", label: "About Me" },
  { key: "resume", label: "Resumé" },
  { key: "gallery", label: "Gallery" },
  { key: "gin_rummy", label: "Gin Rummy" },
  { key: "jeopardy", label: "Jeopardy" },
];


function Home() {
  const [active, setActive] = React.useState<TabKey>("about");

  return (
    <div className="min-h-dvh flex items-start justify-center pt-16 px-4 bg-zinc-50">
      <div className="w-full max-w-[680px] rounded-[22px] overflow-hidden border border-black/10 bg-white/80 backdrop-blur-md shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
        <div className="flex justify-center gap-2 px-4 pt-4 bg-white/70 border-b border-black/10" role="tablist" aria-label="Console tabs">
          {TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(t.key)}
                className={[
                  "select-none px-4 py-2 rounded-t-[14px]",
                  "border border-black/15 border-b-0",
                  "text-[12px] text-[#cc0033] leading-none tracking-[0.08em] font-bold uppercase",
                  "transition hover:-translate-y-[1px] hover:opacity-95",
                  isActive
                    ? "bg-white/95 opacity-100 border-black/20"
                    : "bg-neutral-200/80 opacity-75",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {active === "about" && (
            <section className="space-y-2">
              <h2 className="text-[18px] font-bold tracking-tight">A. D. Myers</h2>
              <p className="text-black/70 text-[14px] leading-relaxed">Placeholder: about me goes here.</p>
            </section>
          )}
          {active === "resume" && (
            <section className="space-y-2">
              <h2 className="text-[18px] font-bold tracking-tight">Resumé</h2>
              <p className="text-black/70 text-[14px] leading-relaxed">Placeholder: resume content goes here.</p>
            </section>
          )}
          {active === "gallery" && (
            <section className="space-y-2">
              <h2 className="text-[18px] font-bold tracking-tight">Gallery</h2>
              <p className="text-black/70 text-[14px] leading-relaxed">Placeholder: coming soon.</p>
            </section>
          )}
          {active === "gin_rummy" && (
  <section role="tabpanel" className="space-y-2">
    <h2 className="text-[18px] font-bold tracking-tight">Gin Rummy</h2>
    <GinRummyPanel />
  </section>
)}
          {active === "jeopardy" && (
            <section className="space-y-2">
              <h2 className="text-[18px] font-bold tracking-tight">Jeopardy</h2>
              <JeopardyTerminal />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
