import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GinRummyPanel } from "../components/GinRummyPanel";
import { JeopardyTerminal } from "../components/JeopardyTerminal";
import { RetroPopups } from "../components/RetroPopups";

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
    title: "Floor Manager",
    dates: "Feb 2019 - Aug 2023",
    location: "Millburn, NJ",
  },
  {
    company: "Black Snow Capital",
    title: "Investment Associate",
    dates: "Jun 2018 - Oct 2018",
    location: "New York City Metro Area",
  },
  {
    company: "Black Snow Capital",
    title: "Investment Associate Intern",
    dates: "Sep 2017 - Jun 2018",
    location: "New York City Metro Area",
  },
  {
    company: "DGL Group LLC",
    title: "Toy Production Intern",
    dates: "Jun 2016 - Aug 2016",
    location: "Edison, NJ",
  },
  {
    company: "LikeWear",
    title: "Graphic Designer / Website Manager",
    dates: "Apr 2012 - Jan 2016",
    location: "Livingston, NJ",
  },
];

const VOLUNTEERING: ResumeRole[] = [
  {
    company: "United Nations",
    title: "Graphic Designer",
    dates: "2012 - Present",
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
              <section className="space-y-4">
                <div className="rounded-2xl border border-[#cc0033]/20 bg-gradient-to-br from-white via-[#fff7f9] to-[#ffe9ef] p-5 shadow-[0_10px_30px_rgba(204,0,51,0.12)]">
                  <h2 className="text-[22px] font-black tracking-tight text-[#7a001f]">A. D. Myers</h2>
                  <p className="text-[12px] uppercase tracking-[0.12em] text-[#b1002c] font-bold">Operations-focused experience</p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                  <h3 className="text-[12px] uppercase tracking-[0.12em] font-extrabold text-[#cc0033]">Experience</h3>
                  <div className="mt-3 space-y-3">
                    {RESUME_ROLES.map((role) => (
                      <article key={`${role.company}-${role.title}`} className="rounded-xl border border-black/10 bg-white p-3">
                        <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr]">
                          <div>
                            <p className="text-[15px] font-black text-black/90">{role.company}</p>
                            <p className="text-[13px] font-semibold text-black/70">{role.title}</p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#b1002c]">{role.dates}</p>
                            <p className="text-[12px] text-black/65">{role.location}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                    <h3 className="text-[12px] uppercase tracking-[0.12em] font-extrabold text-[#cc0033]">Certifications</h3>
                    <ul className="mt-3 space-y-2">
                      {CERTIFICATIONS.map((item) => (
                        <li key={item} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-black/80">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                    <h3 className="text-[12px] uppercase tracking-[0.12em] font-extrabold text-[#cc0033]">Accolades</h3>
                    <ul className="mt-3 space-y-2">
                      {ACCOLADES.map((item) => (
                        <li key={item} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-black/80">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                    <h3 className="text-[12px] uppercase tracking-[0.12em] font-extrabold text-[#cc0033]">Education</h3>
                    <ul className="mt-3 space-y-2">
                      {EDUCATION.map((item) => (
                        <li key={item} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-black/80">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                    <h3 className="text-[12px] uppercase tracking-[0.12em] font-extrabold text-[#cc0033]">Languages</h3>
                    <ul className="mt-3 space-y-2">
                      {LANGUAGES.map((item) => (
                        <li key={item} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] text-black/80">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
                  <h3 className="text-[12px] uppercase tracking-[0.12em] font-extrabold text-[#cc0033]">Volunteering</h3>
                  <div className="mt-3 space-y-3">
                    {VOLUNTEERING.map((role) => (
                      <article key={`${role.company}-${role.title}`} className="rounded-xl border border-black/10 bg-white p-3">
                        <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr]">
                          <div>
                            <p className="text-[15px] font-black text-black/90">{role.company}</p>
                            <p className="text-[13px] font-semibold text-black/70">{role.title}</p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-[12px] font-bold text-[#b1002c]">{role.dates}</p>
                            <p className="text-[12px] text-black/65">{role.location}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
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
    </>
  );
}
