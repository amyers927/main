import * as React from "react";

/* =========================
   Gin Rummy (re-skinned)
   - CPU cards at top
   - Player cards at bottom
   - Symmetric card sizing
   - Smaller action buttons in a single row at bottom
   - “Blue vectory” card backs
   ========================= */

// gin rummy game

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Card = { rank: Rank; suit: Suit; id: string };

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const RANK_TO_NUM: Record<Rank, number> = { A:1, "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,J:11,Q:12,K:13 };

function cardLabel(c: Card) { return `${c.rank}${c.suit}`; }
function isRed(suit: Suit) { return suit === "♥" || suit === "♦"; }

function makeDeck(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ rank: r, suit: s, id: `${r}${s}` });
  return shuffle(d);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function points(c: Card) {
  if (c.rank === "A") return 1;
  if (c.rank === "J" || c.rank === "Q" || c.rank === "K") return 10;
  return Number(c.rank);
}

function sortHand(hand: Card[]) {
  return hand.slice().sort((a,b) => {
    const sa = SUITS.indexOf(a.suit), sb = SUITS.indexOf(b.suit);
    if (sa !== sb) return sa - sb;
    return RANK_TO_NUM[a.rank] - RANK_TO_NUM[b.rank];
  });
}

/** ===== Meld solver (simple but solid) =====
 * We generate all possible melds (sets + runs length>=3),
 * then search combos to minimize deadwood points.
 */
type Meld = { kind: "set" | "run"; cards: Card[]; key: string };

function allMelds(hand: Card[]): Meld[] {
  const melds: Meld[] = [];
  const byRank = new Map<Rank, Card[]>();
  const bySuit = new Map<Suit, Card[]>();

  for (const c of hand) {
    byRank.set(c.rank, [...(byRank.get(c.rank) ?? []), c]);
    bySuit.set(c.suit, [...(bySuit.get(c.suit) ?? []), c]);
  }

  // Sets: 3 or 4 of a kind
  for (const [rank, cards] of byRank.entries()) {
    if (cards.length >= 3) {
      // choose 3
      for (let i=0;i<cards.length;i++) for (let j=i+1;j<cards.length;j++) for (let k=j+1;k<cards.length;k++) {
        const cs = [cards[i], cards[j], cards[k]];
        melds.push({ kind:"set", cards: cs, key: `set:${rank}:${cs.map(x=>x.id).sort().join(",")}` });
      }
      // 4-of-kind
      if (cards.length === 4) {
        const cs = cards.slice();
        melds.push({ kind:"set", cards: cs, key: `set4:${rank}:${cs.map(x=>x.id).sort().join(",")}` });
      }
    }
  }

  // Runs: same suit consecutive length>=3
  for (const [suit, cards] of bySuit.entries()) {
    const nums = cards.map(c => RANK_TO_NUM[c.rank]).sort((a,b)=>a-b);
    const uniqueNums = Array.from(new Set(nums));
    // Build sequences
    let start = 0;
    while (start < uniqueNums.length) {
      let end = start;
      while (end + 1 < uniqueNums.length && uniqueNums[end+1] === uniqueNums[end] + 1) end++;
      const seq = uniqueNums.slice(start, end+1);
      if (seq.length >= 3) {
        // all subruns length>=3
        for (let i=0;i<seq.length;i++) {
          for (let j=i+2;j<seq.length;j++) {
            const runNums = seq.slice(i, j+1);
            const runCards = runNums.map(n => cards.find(c => RANK_TO_NUM[c.rank] === n)!).filter(Boolean);
            melds.push({
              kind:"run",
              cards: runCards,
              key: `run:${suit}:${runNums.join("-")}`,
            });
          }
        }
      }
      start = end + 1;
    }
  }

  // De-dupe by key
  const seen = new Set<string>();
  return melds.filter(m => (seen.has(m.key) ? false : (seen.add(m.key), true)));
}

function bestMeldLayout(hand: Card[]) {
  const melds = allMelds(hand);

  const handIds = new Set(hand.map(c => c.id));
  function meldUsesValidCards(m: Meld) {
    return m.cards.every(c => handIds.has(c.id));
  }
  const filtered = melds.filter(meldUsesValidCards);

  let bestDeadwood = Infinity;
  let bestCombo: Meld[] = [];

  function dfs(idx: number, chosen: Meld[], used: Set<string>) {
    if (idx >= filtered.length) {
      // compute deadwood
      const usedIds = new Set<string>();
      chosen.forEach(m => m.cards.forEach(c => usedIds.add(c.id)));
      let deadwood = 0;
      for (const c of hand) if (!usedIds.has(c.id)) deadwood += points(c);
      if (deadwood < bestDeadwood) {
        bestDeadwood = deadwood;
        bestCombo = chosen.slice();
      }
      return;
    }

    // Prune: if already 0, can't do better
    if (bestDeadwood === 0) return;

    // option: skip
    dfs(idx + 1, chosen, used);

    // option: take if no conflict
    const m = filtered[idx];
    for (const c of m.cards) if (used.has(c.id)) return; // conflict
    const nextUsed = new Set(used);
    m.cards.forEach(c => nextUsed.add(c.id));
    chosen.push(m);
    dfs(idx + 1, chosen, nextUsed);
    chosen.pop();
  }

  dfs(0, [], new Set());
  return { melds: bestCombo, deadwood: bestDeadwood };
}

/** ===== AI (no cheating) =====
 * AI can see: its hand, discardTop, discard pile history (optional), sizes.
 * It cannot see stock order. Monte Carlo samples unknown stock randomly.
 */
type AISnapshot = {
  aiHand: Card[];
  discardTop: Card | null;
  knownDiscards: Card[];     // public history (we keep it)
  stockSize: number;         // only size, not top card
};

function allCardsSet(): Card[] {
  const d: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ rank: r, suit: s, id: `${r}${s}` });
  return d;
}

function sampleUnknownCards(knownIds: Set<string>, count: number) {
  const pool = allCardsSet().filter(c => !knownIds.has(c.id));
  const shuffled = shuffle(pool);
  return shuffled.slice(0, count);
}

function chooseDiscard(hand: Card[]) {
  // discard the card that yields lowest deadwood (greedy)
  let best = hand[0];
  let bestScore = Infinity;
  for (const c of hand) {
    const trial = hand.filter(x => x.id !== c.id);
    const { deadwood } = bestMeldLayout(trial);
    if (deadwood < bestScore) { bestScore = deadwood; best = c; }
  }
  return best;
}

function aiDecideDraw(snapshot: AISnapshot, rollouts = 60) {
  // Return "discard" if taking discardTop is better than drawing unknown stock (expected)
  const discardTop = snapshot.discardTop;
  if (!discardTop) return "stock";

  const base = bestMeldLayout(snapshot.aiHand).deadwood;
  const takeDiscardHand = [...snapshot.aiHand, discardTop];
  const takeBest = bestMeldLayout(takeDiscardHand).deadwood;

  // Monte Carlo expected deadwood after drawing a random unknown card
  const known = new Set<string>([
    ...snapshot.aiHand.map(c=>c.id),
    ...(snapshot.discardTop ? [snapshot.discardTop.id] : []),
    ...snapshot.knownDiscards.map(c=>c.id),
  ]);

  let sum = 0;
  for (let i=0;i<rollouts;i++) {
    const [rand] = sampleUnknownCards(known, 1);
    const trialHand = [...snapshot.aiHand, rand];
    const score = bestMeldLayout(trialHand).deadwood;
    sum += score;
  }
  const expectedStock = sum / rollouts;

  // We prefer whichever reduces deadwood more
  const discardGain = base - takeBest;
  const stockGain = base - expectedStock;

  return discardGain >= stockGain ? "discard" : "stock";
}

/** ===== UI bits ===== */

function CardBack({
  title,
}: {
  title?: string;
}) {
  // “blue vectory” back: gradient + thin diagonal lines + simple center mark
  return (
    <div
      title={title}
      className={[
        "w-8 h-10 sm:w-11 sm:h-[70px]",
        "rounded-xl border border-black/15 shadow-sm",
        "relative overflow-hidden",
        "bg-gradient-to-br from-sky-700 via-blue-700 to-indigo-800",
      ].join(" ")}
    >
      {/* vector-ish diagonal lines */}
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 1px, rgba(255,255,255,0) 6px, rgba(255,255,255,0) 12px)",
        }}
      />
      {/* center glyph */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-7 h-7 rounded-full border border-white/40 bg-white/10 shadow-[0_0_12px_rgba(150,200,255,0.35)]" />
      </div>
      {/* inner frame */}
      <div className="absolute inset-[6px] rounded-lg border border-white/20" />
    </div>
  );
}

function CardFace({
  card,
  selected,
  onClick,
  disabled,
}: {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const red = isRed(card.suit);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-8 h-10 sm:w-11 sm:h-[70px]",
        "rounded-xl border shadow-sm",
        "bg-white/90",
        selected ? "border-white/70 ring-2 ring-sky-300/40" : "border-black/15",
        disabled ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-[1px] hover:bg-white",
        "transition",
        "flex flex-col items-center justify-center gap-0.5",
      ].join(" ")}
      title={cardLabel(card)}
    >
      <div className={["text-xs font-bold leading-none", red ? "text-red-600" : "text-zinc-900"].join(" ")}>
        {card.rank}
      </div>
      <div className={["text-base leading-none", red ? "text-red-600" : "text-zinc-900"].join(" ")}>
        {card.suit}
      </div>
    </button>
  );
}

type Phase = "your_draw" | "your_discard" | "cpu_turn" | "hand_over";

type Game = {
  stock: Card[];        // face-down (player never sees top unless drawn)
  discard: Card[];      // face-up pile
  knownDiscards: Card[]; // public history for AI (no cheating)
  player: Card[];
  cpu: Card[];
  phase: Phase;
  message: string;
  playerScore: number;
  cpuScore: number;
};

function dealNewHand(): Game {
  let deck = makeDeck();
  const player: Card[] = [];
  const cpu: Card[] = [];
  for (let i=0;i<10;i++) {
    player.push(deck.pop()!);
    cpu.push(deck.pop()!);
  }
  const discardTop = deck.pop()!;
  const discard = [discardTop];
  const stock = deck;

  return {
    stock,
    discard,
    knownDiscards: [discardTop],
    player: sortHand(player),
    cpu: sortHand(cpu),
    phase: "your_draw",
    message: "Your turn: draw from Stock or Discard.",
    playerScore: 0,
    cpuScore: 0,
  };
}

function canKnock(hand: Card[]) {
  const { deadwood } = bestMeldLayout(hand);
  return deadwood <= 10;
}

function scoreHand(playerHand: Card[], cpuHand: Card[]) {
  const p = bestMeldLayout(playerHand).deadwood;
  const c = bestMeldLayout(cpuHand).deadwood;

  // Simple gin rummy scoring:
  // - Knock: winner gets (loserDeadwood - winnerDeadwood)
  // - Gin (deadwood 0): +25 bonus
  // - Undercut: if knocker doesn't have lower deadwood, opponent gets diff + 25
  return { pDead: p, cDead: c, bonusGin: 25, bonusUndercut: 25 };
}

function ActionButton({
  children,
  onClick,
  disabled,
  title,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  variant?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "px-3 py-2 rounded-xl border text-[12px] leading-none tracking-[0.06em] uppercase",
        "transition hover:-translate-y-[1px] hover:opacity-95",
        variant === "primary"
          ? "border-sky-200/40 bg-sky-600/20 text-sky-100"
          : "border-white/15 bg-white/5 text-white/80",
        disabled ? "opacity-40 cursor-not-allowed hover:translate-y-0" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function GinRummyPanel() {
  const [game, setGame] = React.useState<Game>(() => dealNewHand());
  const [selectedDiscard, setSelectedDiscard] = React.useState<string | null>(null);

  const discardTop = game.discard[game.discard.length - 1] ?? null;

  const pAnalysis = React.useMemo(() => bestMeldLayout(game.player), [game.player]);
  const cAnalysis = React.useMemo(() => bestMeldLayout(game.cpu), [game.cpu]);

  function reset() {
    setSelectedDiscard(null);
    setGame(dealNewHand());
  }

  function drawFromStock() {
    if (game.phase !== "your_draw") return;
    if (game.stock.length === 0) return;

    const next = game.stock[game.stock.length - 1]; // face-down; player only sees after drawing
    const stock = game.stock.slice(0, -1);

    setGame({
      ...game,
      stock,
      player: sortHand([...game.player, next]),
      phase: "your_discard",
      message: "Choose one card to discard.",
    });
  }

  function drawFromDiscard() {
    if (game.phase !== "your_draw") return;
    if (!discardTop) return;

    const discard = game.discard.slice(0, -1);

    setGame({
      ...game,
      discard,
      player: sortHand([...game.player, discardTop]),
      phase: "your_discard",
      message: "You took the discard. Now choose one card to discard.",
    });
  }

  function discardSelected() {
    if (game.phase !== "your_discard") return;
    if (!selectedDiscard) return;

    const card = game.player.find(c => c.id === selectedDiscard);
    if (!card) return;

    const nextHand = sortHand(game.player.filter(c => c.id !== card.id));
    const nextDiscard = [...game.discard, card];

    setSelectedDiscard(null);
    setGame({
      ...game,
      player: nextHand,
      discard: nextDiscard,
      knownDiscards: [...game.knownDiscards, card],
      phase: "cpu_turn",
      message: "Computer is thinking…",
    });
  }

  function knock() {
    // Player knocks immediately at start of discard phase (common simplification)
    if (game.phase !== "your_discard") return;
    if (!canKnock(game.player)) {
      setGame({ ...game, message: "You can only knock with deadwood ≤ 10." });
      return;
    }

    const { pDead, cDead, bonusGin, bonusUndercut } = scoreHand(game.player, game.cpu);
    let msg = `You knocked. Your deadwood: ${pDead}. CPU deadwood: ${cDead}. `;
    let pAdd = 0, cAdd = 0;

    if (pDead === 0) {
      pAdd = (cDead - pDead) + bonusGin;
      msg += `GIN! +${bonusGin} bonus. You score ${pAdd}.`;
    } else if (pDead < cDead) {
      pAdd = (cDead - pDead);
      msg += `You score ${pAdd}.`;
    } else {
      // undercut
      cAdd = (pDead - cDead) + bonusUndercut;
      msg += `Undercut! CPU scores ${cAdd} (+${bonusUndercut}).`;
    }

    setGame({
      ...game,
      playerScore: game.playerScore + pAdd,
      cpuScore: game.cpuScore + cAdd,
      phase: "hand_over",
      message: msg,
    });
  }

  // CPU turn effect (no cheating)
  React.useEffect(() => {
    if (game.phase !== "cpu_turn") return;

    const t = setTimeout(() => {
      // Build snapshot that *does not include stock order*
      const snap: AISnapshot = {
        aiHand: game.cpu,
        discardTop: discardTop,
        knownDiscards: game.knownDiscards,
        stockSize: game.stock.length,
      };

      const drawChoice = aiDecideDraw(snap, 70); // Monte Carlo rollouts
      let cpuHand = game.cpu.slice();
      let stock = game.stock.slice();
      let discard = game.discard.slice();
      let knownDiscards = game.knownDiscards.slice();

      if (drawChoice === "discard" && discardTop) {
        discard = discard.slice(0, -1);
        cpuHand = sortHand([...cpuHand, discardTop]);
      } else {
        if (stock.length === 0) {
          // If stock empty, must take discard (if any)
          if (discardTop) {
            discard = discard.slice(0, -1);
            cpuHand = sortHand([...cpuHand, discardTop]);
          }
        } else {
          // Draw from stock without peeking: it draws the actual top, but AI never saw it beforehand.
          const drawn = stock[stock.length - 1];
          stock = stock.slice(0, -1);
          cpuHand = sortHand([...cpuHand, drawn]);
        }
      }

      // CPU discard: greedy minimization of deadwood
      const toDiscard = chooseDiscard(cpuHand);
      cpuHand = sortHand(cpuHand.filter(c => c.id !== toDiscard.id));
      discard = [...discard, toDiscard];
      knownDiscards = [...knownDiscards, toDiscard];

      // CPU knock if allowed (simple)
      const cpuCanKnock = canKnock(cpuHand);
      if (cpuCanKnock) {
        const { pDead, cDead, bonusGin, bonusUndercut } = scoreHand(game.player, cpuHand);
        let msg = `CPU knocks. CPU deadwood: ${cDead}. Your deadwood: ${pDead}. `;
        let pAdd = 0, cAdd = 0;

        if (cDead === 0) {
          cAdd = (pDead - cDead) + bonusGin;
          msg += `CPU GIN! +${bonusGin}. CPU scores ${cAdd}.`;
        } else if (cDead < pDead) {
          cAdd = (pDead - cDead);
          msg += `CPU scores ${cAdd}.`;
        } else {
          // undercut by player
          pAdd = (cDead - pDead) + bonusUndercut;
          msg += `Undercut! You score ${pAdd} (+${bonusUndercut}).`;
        }

        setGame({
          ...game,
          stock,
          discard,
          knownDiscards,
          cpu: cpuHand,
          playerScore: game.playerScore + pAdd,
          cpuScore: game.cpuScore + cAdd,
          phase: "hand_over",
          message: msg,
        });
        return;
      }

      setGame({
        ...game,
        stock,
        discard,
        knownDiscards,
        cpu: cpuHand,
        phase: "your_draw",
        message: `CPU drew from ${drawChoice === "discard" ? "Discard" : "Stock"} and discarded ${cardLabel(toDiscard)}. Your turn: draw.`,
      });
    }, 550);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.phase]);

  const isYourDraw = game.phase === "your_draw";
  const isYourDiscard = game.phase === "your_discard";

  return (
    <div className="rounded-xl border border-black/10 bg-zinc-800 p-4 text-blue-100">
      {/* Header (match jeopardy vibe) */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm font-semibold">Gin Rummy</div>
        <div className="text-xs text-blue-300">
          You: <span className="font-semibold text-blue-200">{game.playerScore}</span> · CPU:{" "}
          <span className="font-semibold text-blue-200">{game.cpuScore}</span>
          <span className="ml-2 text-blue-300/80">
            · Stock {game.stock.length} · Discard {discardTop ? cardLabel(discardTop) : "—"}
          </span>
        </div>
      </div>

      {/* Status line */}
      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 mb-3">
        <div
          className="text-[12px] text-blue-200"
          style={{ textShadow: "0 0 4px rgba(120,190,255,0.25)" }}
        >
          {game.message}
        </div>
      </div>

      {/* CPU area (top) */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-xs font-semibold text-blue-200">CPU</div>
            <div className="text-[11px] text-blue-300/80">
              Cards: <span className="font-semibold text-blue-200">{game.cpu.length}</span>
              {game.phase === "hand_over" ? (
                <span className="ml-2">· CPU deadwood was {cAnalysis.deadwood}</span>
              ) : (
                <span className="ml-2">· (hidden)</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {game.cpu.map((c, i) => (
            <CardBack key={`${c.id}-${i}`} title="CPU card (hidden)" />
          ))}
        </div>
      </div>

      {/* Center: Stock + Discard */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-blue-200">Table</div>
          <div className="text-[11px] text-blue-300/80">
            {isYourDiscard ? "Select a card below to discard." : isYourDraw ? "Choose Stock or Discard." : " "}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stock pile */}
          <div className="flex flex-col items-center gap-1">
            <CardBack title="Stock (face-down)" />
            <div className="text-[11px] text-blue-300/80">Stock</div>
          </div>

          {/* Discard pile top */}
          <div className="flex flex-col items-center gap-1">
            {discardTop ? (
              <CardFace
                card={discardTop}
                disabled
              />
            ) : (
              <div className="w-12 h-16 sm:w-14 sm:h-[76px] rounded-xl border border-white/10 bg-white/5" />
            )}
            <div className="text-[11px] text-blue-300/80">Discard</div>
          </div>

          {/* Analysis pill (small, terminal-ish) */}
          <div className="ml-auto hidden sm:block">
            
          </div>
        </div>
      </div>

      {/* Player area (bottom) */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="text-xs font-semibold text-blue-200">You</div>
            <div className="text-[11px] text-blue-300/80">
              Deadwood: <span className="font-semibold text-blue-200">{pAnalysis.deadwood}</span>
              {pAnalysis.deadwood === 0 ? " (Gin!)" : ""}
              <span className="ml-2 text-blue-300/70">· Click to select discard when prompted</span>
            </div>
          </div>
          <div className="text-[11px] text-blue-300/80 sm:hidden">
            Melds: <span className="font-semibold text-blue-200">{pAnalysis.melds.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {game.player.map(c => (
            <CardFace
              key={c.id}
              card={c}
              selected={selectedDiscard === c.id}
              disabled={!isYourDiscard}
              onClick={() => {
                if (isYourDiscard) setSelectedDiscard(c.id);
              }}
            />
          ))}
        </div>

        {/* Melds line (kept, but more compact / terminal-y) */}
        <div className="mt-2 text-[11px] text-blue-300/80">
          {pAnalysis.melds.length > 0 ? (
            <>
              Melds:{" "}
              <span className="text-blue-200">
                {pAnalysis.melds.map(m => `[${m.kind}: ${m.cards.map(cardLabel).join(" ")}]`).join("  ")}
              </span>
            </>
          ) : (
            <>Melds: <span className="text-blue-200">none</span></>
          )}
        </div>
      </div>

      {/* Buttons at very bottom (small, horizontal) */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={drawFromStock}
              disabled={!isYourDraw || game.stock.length === 0}
              variant="primary"
            >
              Draw Stock
            </ActionButton>

            <ActionButton
              onClick={drawFromDiscard}
              disabled={!isYourDraw || !discardTop}
              variant="primary"
            >
              Take Discard
            </ActionButton>

            <ActionButton
              onClick={discardSelected}
              disabled={!isYourDiscard || !selectedDiscard}
            >
              Discard
            </ActionButton>

            <ActionButton
              onClick={knock}
              disabled={!isYourDiscard}
              title="Knock if your deadwood is 10 or less"
            >
              Knock
            </ActionButton>
          </div>

          <div className="flex gap-2">
            <ActionButton onClick={reset}>New Hand</ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// end gin rummy game