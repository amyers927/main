import * as React from "react";

type RoundId = "1" | "2" | "3"; // 1=Jeopardy, 2=DJ, 3=Final

type Clue = {
  round: RoundId;
  category: string;
  clue_value: string;
  daily_double_value: string;
  clue_text: string;
  response: string;
  air_date: string;
};

const JEOP_VALUES = [200, 400, 600, 800, 1000] as const;
const DJ_VALUES = [400, 800, 1200, 1600, 2000] as const;

const NUM_COLS = 6 as const;
const NUM_ROWS = 5 as const;

const HOST_WPM = 175;
const HOST_BASE_SECONDS = 1.2;
const HOST_MIN_SECONDS = 2;
const HOST_MAX_SECONDS = 12;

const BUZZ_SECONDS = 5;
const ANSWER_AFTER_BUZZ_SECONDS = 5;
const DAILY_DOUBLE_SECONDS = 12;
const FINAL_SECONDS = 30;

function unescapeText(s: string) {
  return (s || "")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, "\n");
}

function parseMoney(x: string): number | null {
  if (!x) return null;
  const s = x.replace("$", "").replace(/,/g, "").trim();
  const v = Number(s);
  return Number.isFinite(v) && v > 0 ? Math.trunc(v) : null;
}

function normalize(text: string): string {
  let t = (text || "").toLowerCase().trim();
  t = t.replace(/^(who|what|where|when|why|which)\s+(is|are)\s+/, "");
  t = t.replace(/^(is|are)\s+/, "");
  t = t.replace(/[^a-z0-9\s]/g, "");
  t = t.replace(/\b(the|a|an)\b/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function checkAnswer(user: string, correct: string): boolean {
  const u = normalize(user);
  const c = normalize(correct);
  if (!u || !c) return false;
  return u === c || u.includes(c) || c.includes(u);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function estimateHostReadSeconds(clueText: string): number {
  const words = (clueText || "").split(/\s+/).filter(Boolean).length;
  const wps = HOST_WPM / 60;
  let secs = HOST_BASE_SECONDS + words / wps;
  secs = Math.max(HOST_MIN_SECONDS, Math.min(HOST_MAX_SECONDS, secs));
  return Math.round(secs);
}

function parseDollarValue(input: string): number | null {
  // finds first "$300" or "300" token
  const m = (input || "").match(/\$?\s*([0-9]{2,5})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function stripValueFromPick(input: string): string {
  // remove "$300", "300", and optional "for"
  return (input || "")
    .replace(/\$?\s*[0-9]{2,5}/g, " ")
    .replace(/\bfor\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

function scoreCategoryMatch(query: string, category: string): number {
  // simple but good: word-overlap score
  const q = new Set(words(query));
  const c = new Set(words(category));
  let score = 0;
  for (const w of q) if (c.has(w)) score += 2;   // reward overlap
  // slight preference for longer matches (more words typed)
  score += Math.min(3, q.size);
  return score;
}

function findCategoryIndex(query: string, categories: string[]): number | null {
  const q = query.trim();
  if (!q) return null;

  let bestIdx = -1;
  let bestScore = -Infinity;
  let tie = false;

  for (let i = 0; i < categories.length; i++) {
    const s = scoreCategoryMatch(q, categories[i]);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
      tie = false;
    } else if (s === bestScore) {
      tie = true;
    }
  }

  if (bestScore <= 0) return null;
  if (tie) return null; // force user to be more specific
  return bestIdx;
}

function findRowIndexForValue(value: number, values: number[]): number | null {
  const ri = values.findIndex((v) => v === value);
  return ri >= 0 ? ri : null;
}

function pickDailyDoubles(round: RoundId) {
  const count = round === "1" ? 1 : 2;
  const coords: Array<{ ci: number; ri: number }> = [];
  for (let ci = 0; ci < NUM_COLS; ci++) for (let ri = 0; ri < NUM_ROWS; ri++) coords.push({ ci, ri });
  return new Set(shuffle(coords).slice(0, count).map((x) => `${x.ci},${x.ri}`));
}

function ddWagerLimit(score: number, round: RoundId) {
  const top = round === "1" ? 1000 : 2000;
  return score > 0 ? Math.max(score, top) : top;
}

function clueValueForBoard(c: Clue): number | null {
  return parseMoney(c.daily_double_value) ?? parseMoney(c.clue_value);
}

type BuiltBoard = {
  airDate: string;
  categories: string[]; // 6
  values: number[]; // 5
  board: Clue[][]; // [6][5]
};

function buildBoard(allClues: Clue[], round: RoundId): BuiltBoard {
  const values = round === "1" ? [...JEOP_VALUES] : [...DJ_VALUES];
  const pool = allClues.filter((c) => c.round === round);

  const airDates = shuffle(Array.from(new Set(pool.map((c) => c.air_date).filter(Boolean))));

  for (const air of airDates.slice(0, 400)) {
    const day = pool.filter((c) => c.air_date === air);

    const cats = new Map<string, Clue[]>();
    for (const c of day) {
      const key = c.category || "";
      if (!key) continue;
      cats.set(key, [...(cats.get(key) ?? []), c]);
    }

    const valid = Array.from(cats.entries())
      .filter(([, v]) => v.length >= 5)
      .map(([k]) => k);

    if (valid.length < NUM_COLS) continue;

    const chosen = shuffle(valid).slice(0, NUM_COLS);
    const board: Array<Array<Clue | null>> = Array.from({ length: NUM_COLS }, () =>
      Array.from({ length: NUM_ROWS }, () => null)
    );

    for (let ci = 0; ci < NUM_COLS; ci++) {
      const cat = chosen[ci];
      const lst = (cats.get(cat) ?? []).slice();

      const valued = lst
        .map((c) => [clueValueForBoard(c), c] as const)
        .filter((x) => x[0] != null)
        .sort((a, b) => (a[0]! - b[0]!));

      const used = new Set<number>();

      for (let ri = 0; ri < NUM_ROWS; ri++) {
        const target = values[ri];
        let best: { v: number; c: Clue } | null = null;
        for (const [v0, c] of valued) {
          const v = v0!;
          const id = (c as any).__idx as number | undefined;
          const key = id ?? (Math.random() * 1e9) | 0;
          // (we avoid object identity hacks; we’ll mark used by position below)
          // We'll instead mark used by array index:
        }
        // simpler: pick closest unused by index
        let bestIdx = -1;
        let bestDiff = Infinity;
        for (let i = 0; i < valued.length; i++) {
          if (used.has(i)) continue;
          const v = valued[i][0]!;
          const diff = Math.abs(v - target);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestIdx = i;
          }
        }
        if (bestIdx >= 0) {
          used.add(bestIdx);
          board[ci][ri] = valued[bestIdx][1];
        }
      }

      // fill holes with leftovers
      const leftovers = valued.filter((_, i) => !used.has(i)).map((x) => x[1]);
      const left = shuffle(leftovers);
      for (let ri = 0; ri < NUM_ROWS; ri++) {
        if (!board[ci][ri] && left.length) board[ci][ri] = left.pop()!;
      }
    }

    const full = board.every((col) => col.every(Boolean));
    if (full) {
      return {
        airDate: air,
        categories: chosen,
        values,
        board: board as unknown as Clue[][],
      };
    }
  }

  throw new Error("Couldn't build board from dataset. Try another file / more clues.");
}

/** ===== TSV loader (browser) =====
 * Expects headers: round, category, clue_value, daily_double_value, answer, question, air_date
 * (and we swap answer/question like your Python code)
 */
function parseTSV(text: string): Clue[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];
  const header = lines[0].split("\t").map((x) => x.trim());
  const idx = (name: string) => header.indexOf(name);

  const iRound = idx("round");
  const iCat = idx("category");
  const iClueVal = idx("clue_value");
  const iDDVal = idx("daily_double_value");
  const iAnswer = idx("answer");
  const iQuestion = idx("question");
  const iAir = idx("air_date");

  const out: Clue[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cols = lines[li].split("\t");
    const round = (cols[iRound] ?? "").trim() as RoundId;
    const category = (cols[iCat] ?? "").trim();
    const clue_value = (cols[iClueVal] ?? "").trim();
    const daily_double_value = (cols[iDDVal] ?? "").trim();
    const clue_text = unescapeText((cols[iAnswer] ?? "").trim()); // swapped
    const response = unescapeText((cols[iQuestion] ?? "").trim()); // swapped
    const air_date = (cols[iAir] ?? "").trim();

    if (!round || !category || !clue_text || !response) continue;
    if (round !== "1" && round !== "2" && round !== "3") continue;

    out.push({
      round,
      category,
      clue_value,
      daily_double_value,
      clue_text,
      response,
      air_date,
    });
  }
  return out;
}

// Tiny built-in demo dataset so the UI works even before upload.
const DEMO: Clue[] = [
  { round: "1", category: "DEMO", clue_value: "$200", daily_double_value: "", clue_text: "This framework powers this site.", response: "React", air_date: "demo" },
  { round: "1", category: "DEMO", clue_value: "$400", daily_double_value: "", clue_text: "A utility-first CSS framework often used with Vite.", response: "Tailwind", air_date: "demo" },
  { round: "1", category: "DEMO", clue_value: "$600", daily_double_value: "", clue_text: "This tool builds your dev server on port 3000.", response: "Vite", air_date: "demo" },
  { round: "1", category: "DEMO", clue_value: "$800", daily_double_value: "", clue_text: "In Jeopardy, you must respond in the form of a…", response: "Question", air_date: "demo" },
  { round: "1", category: "DEMO", clue_value: "$1000", daily_double_value: "", clue_text: "A Daily Double lets you…", response: "Wager", air_date: "demo" },

  { round: "1", category: "MORE DEMO", clue_value: "$200", daily_double_value: "", clue_text: "Letters A–F represent these on the board.", response: "Columns", air_date: "demo" },
  { round: "1", category: "MORE DEMO", clue_value: "$400", daily_double_value: "", clue_text: "Numbers 1–5 represent these on the board.", response: "Rows", air_date: "demo" },
  { round: "1", category: "MORE DEMO", clue_value: "$600", daily_double_value: "", clue_text: "This is the face-up pile you can take from.", response: "Discard", air_date: "demo" },
  { round: "1", category: "MORE DEMO", clue_value: "$800", daily_double_value: "", clue_text: "This is the face-down pile you draw from.", response: "Stock", air_date: "demo" },
  { round: "1", category: "MORE DEMO", clue_value: "$1000", daily_double_value: "", clue_text: "Command to generate a new board.", response: "r", air_date: "demo" },

  // Fill to 6 categories x 5 for the demo board builder (same air_date + >=5 per category)
  ...Array.from({ length: 20 }).map((_, i) => {
    const cats = ["CAT A", "CAT B", "CAT C", "CAT D"];
    const cat = cats[i % cats.length];
    const vals = ["$200", "$400", "$600", "$800", "$1000"];
    return {
      round: "1" as const,
      category: cat,
      clue_value: vals[Math.floor(i / 4) % 5],
      daily_double_value: "",
      clue_text: `Demo filler clue ${i + 1}.`,
      response: `Demo answer ${i + 1}.`,
      air_date: "demo",
    };
  }),
];

type Phase =
  | "idle"
  | "round_board"
  | "host_reading"
  | "buzz_open"
  | "answering"
  | "daily_double_wager"
  | "daily_double_answer"
  | "final_wager"
  | "final_answer"
  | "between_rounds"
  | "game_over";

type Pending = {
  clue: Clue;
  ci: number;
  ri: number;
  faceValue: number;
  isDailyDouble: boolean;
};

function nowId() {
  return Math.random().toString(16).slice(2);
}

function TerminalLine({ line }: { line: { id: string; text: string; dim?: boolean } }) {
  return (
    <div
      className={line.dim ? "text-blue-200" : "text-blue-400"}
      style={{
        textShadow: line.dim
          ? "0 0 2px rgba(255,255,255,0.2)"
          : "0 0 4px rgba(255,255,255,0.35)",
      }}
    >
      {line.text}
    </div>
  );
}

export function JeopardyTerminal() {
  const [clues, setClues] = React.useState<Clue[]>(DEMO);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [round, setRound] = React.useState<RoundId>("1");
  const [score, setScore] = React.useState(0);

  const [board, setBoard] = React.useState<BuiltBoard | null>(null);
  const [picked, setPicked] = React.useState<boolean[][]>(
    () => Array.from({ length: NUM_COLS }, () => Array.from({ length: NUM_ROWS }, () => false))
  );

  const [ddSet, setDdSet] = React.useState<Set<string>>(new Set());
  const [pending, setPending] = React.useState<Pending | null>(null);

  const [lines, setLines] = React.useState<Array<{ id: string; text: string; dim?: boolean }>>(() => [
    { id: nowId(), text: "jeopardy.py (web edition) — terminal mode", dim: true },
    { id: nowId(), text: "Type: start  |  help", dim: true },
  ]);

  const [input, setInput] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);
 const termRef = React.useRef<HTMLDivElement | null>(null);

  const [timer, setTimer] = React.useState<number | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const append = React.useCallback((text: string, dim = false) => {
    setLines((prev) => [...prev, { id: nowId(), text, dim }]);
  }, []);

  const clear = React.useCallback(() => {
    setLines([{ id: nowId(), text: "jeopardy.py (web edition) — terminal mode", dim: true }]);
  }, []);

  const focusInput = React.useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

// Auto scroll
React.useEffect(() => {
  const el = termRef.current;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}, [lines.length]);

  // Auto-load TSV from /public at startup (optional)
React.useEffect(() => {
  (async () => {
    try {
      // IMPORTANT: this path is from /public
      const res = await fetch("/data/combined_season1-41.tsv");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseTSV(text);
      if (parsed.length) {
        setClues(parsed);
      } else {
        append("Auto-load: TSV fetched but parsed 0 clues (check headers).", true);
      }
    } catch (e) {
      append("Auto-load: couldn't fetch /data/combined_season1-41.tsv (check public path).", true);
    }
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  React.useEffect(() => {
    focusInput();
  }, [focusInput]);

  // tick down
  React.useEffect(() => {
    if (timer == null) return;
    timerRef.current = timer;
    const t = window.setInterval(() => {
      setTimer((s) => (s == null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => window.clearInterval(t);
  }, [timer]);

  React.useEffect(() => {
    if (timer !== 0) return;

    // timer hit 0 => auto-resolve depending on phase
    if (phase === "buzz_open") {
      append("⛔ You didn’t buzz in time.");
      if (pending) {
        append(`Correct response: ${pending.clue.response}`);
        markClueDoneAndReturn(0);
      }
    } else if (phase === "answering") {
      append("⏰ You buzzed, but didn’t answer in time.");
      if (pending) {
        append(`Correct response: ${pending.clue.response}`);
        markClueDoneAndReturn(-pending.faceValue);
      }
    } else if (phase === "daily_double_answer") {
      append("⏰ Time’s up on the Daily Double.");
      if (pending) {
        // if no answer, treat as wrong
        append(`Correct response: ${pending.clue.response}`);
        // wager is stored in pending.faceValue for DD flow
        markClueDoneAndReturn(-pending.faceValue);
      }
    } else if (phase === "final_answer") {
      append("⏰ Time’s up on Final Jeopardy.");
      // For brevity: end game at final timeout
      setPhase("game_over");
      append(`Game over. Final score: $${score}`, true);
    }

    setTimer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, phase]);

function newBoard(r: RoundId) {
  const b = buildBoard(clues, r);

  const freshPicked = Array.from({ length: NUM_COLS }, () =>
    Array.from({ length: NUM_ROWS }, () => false)
  );

  setBoard(b);
  setPicked(freshPicked);
  setDdSet(pickDailyDoubles(r));
  setPending(null);
  setPhase("round_board");

  clear();
  append(`ROUND ${r} — ${b.airDate || ""}`.trim(), true);
  append(`Score: $${score}`, true);
  append(
    `Pick a clue by typing the category and value (ex: "rivers for $500"). Commands: r (new board), q (quit)`,
    true
  );

  renderBoardToTerminal(b, freshPicked);
  focusInput();
}

function renderBoardToTerminal(b: BuiltBoard, pickedSnap: boolean[][]) {
  append("");
  append("BOARD", true);
  append("=".repeat(60), true);

  for (let ci = 0; ci < NUM_COLS; ci++) {
    const catName = b.categories[ci].toUpperCase();
    append(`${catName}`, true);

    let rowLine = "  ";
    for (let ri = 0; ri < NUM_ROWS; ri++) {
      if (pickedSnap[ci]?.[ri]) {
        rowLine += "     ----     ";
      } else {
        rowLine += `     $${b.values[ri]}     `;
      }
    }

    append(rowLine, true);
    append("-".repeat(60), true);
  }

  const remaining = (() => {
    let n = 0;
    for (let ci = 0; ci < NUM_COLS; ci++)
      for (let ri = 0; ri < NUM_ROWS; ri++)
        if (!pickedSnap[ci][ri]) n++;
    return n;
  })();

  append("");
  append(`Remaining clues: ${remaining}`, true);
}

  function countRemaining() {
    let n = 0;
    for (let ci = 0; ci < NUM_COLS; ci++) for (let ri = 0; ri < NUM_ROWS; ri++) if (!picked[ci][ri]) n++;
    return n;
  }

  function markPicked(ci: number, ri: number) {
    setPicked((prev) => prev.map((col, c) => (c !== ci ? col : col.map((v, r) => (r !== ri ? v : true)))));
  }

  function markClueDoneAndReturn(delta: number) {
    setTimer(null);
    setScore((s) => s + delta);

    setPending(null);
    setPhase("round_board");

    // check board clear after state updates settle
    setTimeout(() => {
      const rem = countRemaining();
      if (rem <= 0) {
        append("");
        append(`✅ Board cleared! Round ${round} complete.`, true);

        if (round === "1") {
          setPhase("between_rounds");
          append(`Type: next  (to start Double Jeopardy)`, true);
        } else if (round === "2") {
          setPhase("between_rounds");
          append(`Type: final  (Final Jeopardy) or done`, true);
        } else {
          setPhase("game_over");
          append(`Game over. Final score: $${score + delta}`, true);
        }
      } else {
        // redraw board with updated picked
        if (board) {
          append("");
          append(`Score: $${score + delta}`, true);
          renderBoardToTerminal(board, picked);
        }
      }
    }, 0);
  }

  function startClue(ci: number, ri: number) {
    if (!board) return;
    if (picked[ci][ri]) {
      append("That clue is already taken.");
      return;
    }

    const clue = board.board[ci][ri];
    const faceValue = board.values[ri];
    const isDD = ddSet.has(`${ci},${ri}`);

    markPicked(ci, ri);

    setPending({ clue, ci, ri, faceValue, isDailyDouble: isDD });

    append("");
    append(`${clue.category} | $${faceValue}`);
    append("");
    clue.clue_text.split("\n").forEach((ln) => append(ln));

if (isDD) {
  const max = ddWagerLimit(score, round);
  setPhase("daily_double_wager");
  append("");
  append(`🎯 DAILY DOUBLE! Your score: $${score}. Max wager: $${max}`);
  append(`Enter wager (0–${max}):`);
  focusInput();
  return;
    }

    const readSecs = estimateHostReadSeconds(clue.clue_text);
    setPhase("host_reading");
    append("");
    append(`📣 Alex is reading… (~${readSecs}s)`, true);

    // after read -> buzz opens
    window.setTimeout(() => {
      setPhase("buzz_open");
      append(`BUZZ! (type: b) [${BUZZ_SECONDS}s]`);
      setTimer(BUZZ_SECONDS);
      focusInput();
    }, readSecs * 1000);
  }

  function handleCommand(raw: string) {
    const cmd = raw.trim();

    if (!cmd) return;

    // global commands
    if (cmd.toLowerCase() === "help") {
      append("Commands:");
      append("  start        — start round 1");
      append("  r            — new board (current round)");
      append("  buzz         — buzz in during buzz window");
      append("  next         — start Double Jeopardy (after round 1)");
      append("  final        — Final Jeopardy (after round 2)");
      append("  q            — quit");
      return;
    }

    if (cmd.toLowerCase() === "q" || cmd.toLowerCase() === "quit" || cmd.toLowerCase() === "exit") {
      append("bye 👋", true);
      setPhase("game_over");
      return;
    }

    if (cmd.toLowerCase() === "start") {
      setRound("1");
      newBoard("1");
      return;
    }

    if (cmd.toLowerCase() === "r" || cmd.toLowerCase() === "new") {
      newBoard(round);
      return;
    }

    if (cmd.toLowerCase() === "next" && phase === "between_rounds" && round === "1") {
      setRound("2");
      newBoard("2");
      return;
    }

    if (cmd.toLowerCase() === "final" && phase === "between_rounds" && round === "2") {
      // minimal final jeopardy flow: pick any final clue from round 3
      const finals = clues.filter((c) => c.round === "3");
      if (!finals.length) {
        append("No Final Jeopardy clues found in dataset.");
        setPhase("game_over");
        append(`Game over. Final score: $${score}`, true);
        return;
      }
      const clue = finals[Math.floor(Math.random() * finals.length)];
      setPhase("final_wager");
      setPending({ clue, ci: 0, ri: 0, faceValue: 0, isDailyDouble: false });
      append("");
      append("FINAL JEOPARDY", true);
      append(`Category: ${clue.category}`, true);
      append(`Enter wager (0–${Math.max(score, 0)}):`);
      focusInput();
      return;
    }

    // phase-specific input
    if (phase === "buzz_open") {
      if (cmd.toLowerCase() !== "b") {
        append(`(During buzz window, type: b)`, true);
        return;
      }
      setTimer(null);
      setPhase("answering");
      append(`> (answer) [${ANSWER_AFTER_BUZZ_SECONDS}s]`);
      setTimer(ANSWER_AFTER_BUZZ_SECONDS);
      return;
    }

    if (phase === "answering") {
      // answer submission
      if (!pending) return;
      setTimer(null);
      append(`Correct response: ${pending.clue.response}`);
      const ok = checkAnswer(cmd, pending.clue.response);
      const delta = ok ? pending.faceValue : -pending.faceValue;
      append(ok ? `✅ Correct! +$${pending.faceValue}` : `❌ Incorrect. -$${pending.faceValue}`);
      markClueDoneAndReturn(delta);
      return;
    }

    if (phase === "daily_double_wager") {
      if (!pending) return;
      const max = ddWagerLimit(score, round);
      const w = Number(cmd);
      if (!Number.isFinite(w) || w < 0 || w > max) {
        append(`Invalid wager. Enter a number 0–${max}.`);
        return;
      }
      // reuse pending.faceValue to store wager for DD
      setPending({ ...pending, faceValue: Math.trunc(w) });
      setPhase("daily_double_answer");
      append("");
      append("Type your response (Daily Double requires an answer):");
      append(`> [${DAILY_DOUBLE_SECONDS}s]`);
      setTimer(DAILY_DOUBLE_SECONDS);
      return;
    }

    if (phase === "daily_double_answer") {
      if (!pending) return;
      setTimer(null);
      const ok = checkAnswer(cmd, pending.clue.response);
      append(`Correct response: ${pending.clue.response}`);
      const delta = ok ? pending.faceValue : -pending.faceValue;
      append(ok ? `✅ Correct! +$${pending.faceValue}` : `❌ Incorrect. -$${pending.faceValue}`);
      markClueDoneAndReturn(delta);
      return;
    }

    if (phase === "final_wager") {
      if (!pending) return;
      const max = Math.max(score, 0);
      const w = Number(cmd);
      if (!Number.isFinite(w) || w < 0 || w > max) {
        append(`Invalid wager. Enter a number 0–${max}.`);
        return;
      }
      setPending({ ...pending, faceValue: Math.trunc(w) });
      setPhase("final_answer");
      append("");
      append("Final Jeopardy Clue:", true);
      pending.clue.clue_text.split("\n").forEach((ln) => append(ln));
      append("");
      append(`> [${FINAL_SECONDS}s]`);
      setTimer(FINAL_SECONDS);
      return;
    }

    if (phase === "final_answer") {
      if (!pending) return;
      setTimer(null);
      const ok = checkAnswer(cmd, pending.clue.response);
      append(`Correct response: ${pending.clue.response}`);
      const delta = ok ? pending.faceValue : -pending.faceValue;
      append(ok ? `✅ Correct! +$${pending.faceValue}` : `❌ Incorrect. -$${pending.faceValue}`);
      setScore((s) => s + delta);
      setPhase("game_over");
      append(`Game over. Final score: $${score + delta}`, true);
      return;
    }

    // default: board selection
if (phase === "round_board") {
  if (!board) return;

  const value = parseDollarValue(cmd);
  const catQuery = stripValueFromPick(cmd);

  if (!value || !catQuery) {
    append(`Try: "First Wives for 300" (category words + value).`, true);
    return;
  }

  const ci = findCategoryIndex(catQuery, board.categories);
  if (ci == null) {
    append(`Couldn't uniquely match category "${catQuery}". Try adding another word.`, true);
    append(`Examples: "${board.categories[0]} for ${board.values[0]}"`, true);
    return;
  }

  const ri = findRowIndexForValue(value, board.values);
  if (ri == null) {
    append(`That value isn't on this board. Valid: ${board.values.join(", ")}`, true);
    return;
  }

  startClue(ci, ri);
  return;
}
    append(`(Not sure what to do with "${cmd}" right now.)`, true);
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm text-blue-400 font-semibold"></div>
        <div className="text-xs text-blue-300">
          Round: <span className="font-semibold text-blue-400">{round}</span> · Score:{" "}
          <span className="font-semibold text-blue-400">${score}</span>
          {timer != null ? (
            <>
              {" "}
              · ⏳ <span className="font-semibold text-blue-300">{timer}s</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-zinc-800 p-3">
        <div 
          ref={termRef}
          className="h-[380px] min-h-[420px] overflow-auto font-mono text-[11px] leading-none space-y-1">
          {lines.map((l) => (
            <TerminalLine key={l.id} line={l} />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="font-mono text-[12px] text-blue-100">{">"}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = input;
                setInput("");
                append(`> ${v}`, true);
                handleCommand(v);
              }
            }}
            className="flex-1 font-mono text-[12px] px-3 py-2 rounded-xl border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
            placeholder="type a command (help, start, selection phrase, b (to buzz), etc)"
          />

        </div>
      </div>


    </div>
  );
}