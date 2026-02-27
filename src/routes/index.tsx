import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RetroPopups } from "../components/RetroPopups";

export const Route = createFileRoute("/")({
  component: Home,
});

const GinRummyPanel = React.lazy(async () => {
  const mod = await import("../components/GinRummyPanel");
  return { default: mod.GinRummyPanel };
});

const JeopardyTerminal = React.lazy(async () => {
  const mod = await import("../components/JeopardyTerminal");
  return { default: mod.JeopardyTerminal };
});

type TabKey = "about" | "resume" | "gallery" | "gin_rummy" | "jeopardy";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "about", label: "About Me" },
  { key: "resume", label: "Resumé" },
  { key: "gallery", label: "Gallery" },
  { key: "gin_rummy", label: "Gin Rummy" },
  { key: "jeopardy", label: "Jeopardy" },
];

type ResumeRole = {
  company: string;
  title: string;
  dates: string;
  location: string;
};

const RESUME_ROLES: ResumeRole[] = [
  {
    company: "Xomox Jewelry",
    title: "Operations Associate",
    dates: "Jul 2025 - Present",
    location: "New York, NY",
  },
  {
    company: "Norwegian People's Aid",
    title: "Operations Volunteer",
    dates: "Jun 2024 - Oct 2024",
    location: "Sarajevo, Bosnia & Herzegovina",
  },
  {
    company: "Liv Breads",
    title: "Floor & Store Manager",
    dates: "Feb 2019 - Aug 2023",
    location: "Millburn, NJ",
  },
  {
    company: "Black Snow Capital",
    title: "Investment Associate",
    dates: "Sep 2017 - Oct 2018",
    location: "New York City Metro Area",
  },
];

const VOLUNTEERING: ResumeRole[] = [
  {
    company: "United Nations",
    title: "Graphic Designer",
    dates: "2012",
    location: "Disaster and Humanitarian Relief",
  },
];

const CERTIFICATIONS = [
  "ServSafe Certification",
  "Norwegian People's Aid Mine Action Training Course (September 2024) - Sarajevo, Bosnia & Herzegovina",
];

const ACCOLADES = [
  "2nd Place Trivia Finish - Doyle's Pour House (Barnegat, NJ)",
  "2nd Place Trivia Finish - Clara's (Bushwick, NY)",
];

const EDUCATION = [
  "Rutgers University - B.A., Economics (2017) - cum laude",
];

const LANGUAGES = [
  "Conversational French",
];

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
      <h3 className="text-[12px] uppercase tracking-[0.12em] font-extrabold text-[#cc0033]">{title}</h3>
      {children}
    </div>
  );
}

function ResumeRoleList({ roles }: { roles: ResumeRole[] }) {
  return (
    <ul className="mt-3 divide-y divide-black/10">
      {roles.map((role) => (
        <li
          key={`${role.company}-${role.title}`}
          className="py-3 first:pt-0 last:pb-0"
        >
          <p className="text-[15px] font-black text-black/90">{role.company}</p>
          <p className="text-[13px] font-semibold text-black/70">{role.title}</p>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#b1002c]">{role.dates}</p>
          <p className="text-[12px] text-black/65">{role.location}</p>
        </li>
      ))}
    </ul>
  );
}

function ResumeTextList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 divide-y divide-black/10">
      {items.map((item) => (
        <li key={item} className="py-2 first:pt-0 last:pb-0 text-[13px] text-black/80">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Home() {
  const [active, setActive] = React.useState<TabKey>("about");

  return (
    <>
      <RetroPopups />
      <div
        className="min-h-dvh flex items-start justify-center pt-16 px-4"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0.75)), url('/images/hank.png')",
          backgroundRepeat: "repeat, repeat",
          backgroundSize: "auto, 300px auto",
        }}
      >
        <div className="w-full max-w-[680px] rounded-[22px] overflow-hidden border border-black/10 bg-white/80 backdrop-blur-md shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 px-2 sm:px-4 pt-3 sm:pt-4 bg-white/70 border-b border-black/10" role="tablist" aria-label="Console tabs">
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
                    "select-none px-2 sm:px-4 py-2 rounded-t-[12px] sm:rounded-t-[14px]",
                    "border border-black/15 border-b-0",
                    "text-[10px] sm:text-[12px] text-[#cc0033] leading-none tracking-[0.06em] sm:tracking-[0.08em] font-bold uppercase",
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
              <section className="space-y-3">
                <h2 className="text-[22px] font-black tracking-tight text-[#cc0033]">"What's up, Drü Crew?"</h2>
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div className="space-y-3 text-black/75 text-[13px] leading-relaxed">
                    <p>Hi, my name is Andrew; welcome to my website! It's nice to get to know you.</p>
                    <p>
                      Right now, I work in operations at an end-to-end jewelry manufacturer called Xomox Jewelry on 40th street,
                      where I build systems, autonomous and not, to track workflows and manage inventories across multiple
                      departments. Before this, I worked at Liv Breads (bakery) in Millburn, NJ; I miss their pastries all the
                      time!
                    </p>
                    <p>
                      In my free time, I enjoy filling out the New York Times crossword (Friday and Saturday only, please!),
                      reading Robert Caro&apos;s &quot;The Years of Lyndon Johnson&quot; series, and relaxing at the Jersey Shore with my best friends.
                      The background image of this website is my lovely girlfriend, Hank, whose work can be seen at{" "}
                      <a
                        href="https://hanky.info"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold text-[#7a001f]"
                      >
                        hanky.info
                      </a>
                      . I&apos;d also like to extend, very warmly, my gratitude, to Robert Fidler, who helped me build this
                      site (and who&apos;s always challenging me to think harder about things). His work can be seen at{" "}
                      <a
                        href="https://bobbyfidz.tech"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold text-[#7a001f]"
                      >
                        bobbyfidz.tech
                      </a>
                      .
                    </p>
                    <p>
                      If you have any questions, don&apos;t hesitate to email me at{" "}
                      <a
                        href="mailto:andrew@albeirutiholdings.com"
                        className="underline font-semibold text-[#7a001f]"
                      >
                        andrew@albeirutiholdings.com
                      </a>
                      ; I&apos;d love to connect! While you&apos;re here, give my Rutgers-themed Gin Rummy a shot, or play a
                      terminal-based game of Jeopardy and see how smart you are. Hopefully soon I can add some high scores.
                    </p>
                    <p>All the best,</p>
                    <p className="font-semibold">A. D. Myers</p>
                  </div>
                  <img
                    src="/images/me2.jpg"
                    alt="Portrait of A. D. Myers"
                    className="w-full max-w-[180px] md:max-w-[160px] rounded-xl border border-black/10 shadow-sm opacity-100 justify-self-start md:justify-self-end"
                  />
                </div>
              </section>
            )}
            {active === "resume" && (
              <section className="space-y-4">
                <section className="rounded-2xl border border-[#cc0033]/20 bg-gradient-to-br from-white via-[#fff7f9] to-[#ffe9ef] p-5 shadow-[0_10px_30px_rgba(204,0,51,0.12)]">
                  <h2 className="text-[22px] font-black tracking-tight text-[#7a001f]">A. D. Myers</h2>
                  <p className="text-[12px] uppercase tracking-[0.12em] text-[#b1002c] font-bold">Operations-focused experience</p>
                </section>

                <ResumeSection title="Experience">
                  <ResumeRoleList roles={RESUME_ROLES} />
                </ResumeSection>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ResumeSection title="Certifications">
                    <ResumeTextList items={CERTIFICATIONS} />
                  </ResumeSection>
                  <ResumeSection title="Accolades">
                    <ResumeTextList items={ACCOLADES} />
                  </ResumeSection>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ResumeSection title="Education">
                    <ResumeTextList items={EDUCATION} />
                  </ResumeSection>
                  <ResumeSection title="Languages">
                    <ResumeTextList items={LANGUAGES} />
                  </ResumeSection>
                </div>

                <ResumeSection title="Volunteering">
                  <ResumeRoleList roles={VOLUNTEERING} />
                </ResumeSection>
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
                <React.Suspense
                  fallback={<p className="text-[13px] text-black/60">Loading Gin Rummy...</p>}
                >
                  <GinRummyPanel />
                </React.Suspense>
              </section>
            )}
            {active === "jeopardy" && (
              <section className="space-y-2">
                <h2 className="text-[18px] font-bold tracking-tight">Jeopardy</h2>
                <React.Suspense
                  fallback={<p className="text-[13px] text-black/60">Loading Jeopardy...</p>}
                >
                  <JeopardyTerminal />
                </React.Suspense>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
