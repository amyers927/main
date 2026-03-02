import * as React from "react";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Card = { rank: Rank; suit: Suit; id: string };
type SeatKind = "player" | "friend" | "rando";
type Phase = "betting" | "in_round" | "round_over";

type Occupant = {
  id: string;
  name: string;
  kind: SeatKind;
  flags: string;
};

type RoundSeat = {
  id: string;
  seatIndex: number;
  name: string;
  kind: SeatKind;
  flags: string;
  hand: Card[];
  bet: number;
  stood: boolean;
  busted: boolean;
  blackjack: boolean;
  result?: string;
};

type DrinkKey = "gin_soda" | "modelo" | "margarita" | "water";

type PlayerHandState = {
  cards: Card[];
  bet: number;
  stood: boolean;
  busted: boolean;
  blackjack: boolean;
  doubled: boolean;
  holeCardIndex: number | null;
  holeCardRevealed: boolean;
  result?: string;
};

const TABLE_MIN = 25;
const STARTING_BANKROLL = 400;
const MAX_SEATS = 6;
const MAX_FRIENDS_INCLUDING_PLAYER = 5;
const MAX_FRIEND_SEATS = MAX_FRIENDS_INCLUDING_PLAYER - 1;
const SHOE_DECKS = 6;
const TOTAL_SHOE_CARDS = SHOE_DECKS * 52;
const CUT_CARD_THRESHOLD = 52;

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const CHARACTER_NAMES = [
  "Andrew",
  "Robert",
  "Alice",
  "Roth",
  "Hank",
  "Anthony",
  "Chris",
  "Zamin",
  "TJ",
  "Ricky",
  "Evan",
  "Jessica",
  "Carly",
  "Carleigh",
  "John",
];
const NON_PLAYER_SEAT_ORDER = [0, 2, 3, 4, 5];

const CHARACTER_FLAGS: Record<string, string> = {
  andrew: "🇺🇸🇱🇧",
  robert: "🇺🇸🧩",
  alice: "🇨🇳",
  roth: "🇺🇸🏳️‍🌈",
  hank: "🇮🇳🇵🇭",
  anthony: "🇺🇸",
  chris: "🇺🇸🇬🇧",
  zamin: "🇺🇸🇵🇰",
  tj: "🇺🇸🇮🇹",
  ricky: "🇺🇸",
  evan: "🇺🇸",
  jessica: "🇺🇸",
  carly: "🇺🇸",
  carleigh: "🇺🇸",
  john: "🇺🇸🇮🇹",
};

type CountryIdentity = {
  country: string;
  flag: string;
  firstNames: string[];
  lastNames: string[];
};

const RANDO_COUNTRIES: CountryIdentity[] = [
  { country: "United States", flag: "🇺🇸", firstNames: ["Alex", "Jordan", "Taylor"], lastNames: ["Miller", "Carter", "Hayes"] },
  { country: "Lebanon", flag: "🇱🇧", firstNames: ["Karim", "Nour", "Layla"], lastNames: ["Haddad", "Khoury", "Nassar"] },
  { country: "India", flag: "🇮🇳", firstNames: ["Arjun", "Priya", "Rohan"], lastNames: ["Patel", "Sharma", "Rao"] },
  { country: "Philippines", flag: "🇵🇭", firstNames: ["Miguel", "Lia", "Andres"], lastNames: ["Santos", "Reyes", "Cruz"] },
  { country: "China", flag: "🇨🇳", firstNames: ["Wei", "Mei", "Jun"], lastNames: ["Li", "Wang", "Zhang"] },
  { country: "Russia", flag: "🇷🇺", firstNames: ["Viktor", "Nadia", "Sergei"], lastNames: ["Volkov", "Petrov", "Ivanov"] },
  { country: "Brazil", flag: "🇧🇷", firstNames: ["Mateus", "Ana", "Rafa"], lastNames: ["Silva", "Santos", "Costa"] },
  { country: "France", flag: "🇫🇷", firstNames: ["Luc", "Camille", "Noah"], lastNames: ["Martin", "Dubois", "Moreau"] },
];

const CHIP_DENOMS = [
  { value: 1000, label: "1K", color: "#fff3d1", ring: "#9f5f00" },
  { value: 500, label: "500", color: "#d9faec", ring: "#148a5b" },
  { value: 100, label: "100", color: "#f2ecff", ring: "#5c2ca5" },
  { value: 25, label: "25", color: "#ffe2ec", ring: "#b1002c" },
  { value: 5, label: "5", color: "#dbf0ff", ring: "#1f6bb5" },
  { value: 2.5, label: "2.5", color: "#f8ede4", ring: "#c57e1e" },
];

const DRINK_LABELS: Record<DrinkKey, string> = {
  gin_soda: "Gin & Soda",
  modelo: "Modelo",
  margarita: "Margarita",
  water: "Just water (let's sober up)",
};

const DRINK_IMAGE_SRC: Record<DrinkKey, string> = {
  gin_soda: "/images/ginsoda.png",
  modelo: "/images/beer.png",
  margarita: "/images/margarita.png",
  water: "/images/water.png",
};

const DRINK_OPTIONS: Array<{ key: DrinkKey; label: string }> = [
  { key: "gin_soda", label: DRINK_LABELS.gin_soda },
  { key: "modelo", label: DRINK_LABELS.modelo },
  { key: "margarita", label: DRINK_LABELS.margarita },
  { key: "water", label: DRINK_LABELS.water },
];

const SEAT_POSITIONS: Record<number, { left: string; top: string }> = {
  0: { left: "8%", top: "50%" },
  1: { left: "23%", top: "58%" },
  2: { left: "45%", top: "66%" },
  3: { left: "67%", top: "58%" },
  4: { left: "82%", top: "50%" },
  5: { left: "94%", top: "43%" },
};

const FELT_TEXTURE = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
    <defs>
      <filter id="feltNoise" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0.22"/>
        </feComponentTransfer>
      </filter>
    </defs>
    <rect width="180" height="180" fill="rgba(255,255,255,0.03)"/>
    <rect width="180" height="180" filter="url(#feltNoise)" opacity="0.6"/>
    <g opacity="0.22">
      <path d="M0 34h180M0 95h180M0 152h180" stroke="rgba(255,255,255,0.11)" stroke-width="0.6"/>
      <path d="M22 0v180M88 0v180M146 0v180" stroke="rgba(0,0,0,0.08)" stroke-width="0.6"/>
    </g>
  </svg>`,
);

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeShoe(decks: number) {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ rank, suit, id: `${d}-${rank}${suit}-${cards.length}` });
      }
    }
  }
  return shuffle(cards);
}

function drawFromShoe(workingShoe: Card[]) {
  return workingShoe.pop();
}

function isRed(suit: Suit) {
  return suit === "♥" || suit === "♦";
}

function cardPoint(rank: Rank) {
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return Number(rank);
}

function handValue(cards: Card[]) {
  let total = cards.reduce((sum, c) => sum + cardPoint(c.rank), 0);
  let aces = cards.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function hasSoftAce(cards: Card[]) {
  let total = cards.reduce((sum, c) => sum + cardPoint(c.rank), 0);
  let aces = cards.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return cards.some((c) => c.rank === "A") && total <= 21 && aces > 0;
}

function isBlackjack(cards: Card[]) {
  return cards.length === 2 && handValue(cards) === 21;
}

function getDealerUpValue(card: Card | undefined) {
  if (!card) return 0;
  if (card.rank === "A") return 11;
  if (card.rank === "J" || card.rank === "Q" || card.rank === "K") return 10;
  return Number(card.rank);
}

function getBookAdvice(playerCards: Card[], dealerUp: Card | undefined) {
  if (!dealerUp || playerCards.length === 0) {
    return "I need to see your hand and Roxane's up-card first.";
  }

  const up = getDealerUpValue(dealerUp);
  const total = handValue(playerCards);
  const isPair = playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank;

  if (isPair) {
    const rank = playerCards[0].rank;
    if (rank === "A" || rank === "8") return "I would split.";
    if (rank === "10" || rank === "J" || rank === "Q" || rank === "K") return "I would stand.";
    if (rank === "9") return up === 7 || up >= 10 ? "I would stand." : "I would split.";
    if (rank === "7") return up <= 7 ? "I would split." : "I would hit.";
    if (rank === "6") return up >= 2 && up <= 6 ? "I would split." : "I would hit.";
    if (rank === "5") return up >= 2 && up <= 9 ? "You should double." : "I would hit.";
    if (rank === "4") return up === 5 || up === 6 ? "I would split." : "I would hit.";
    if (rank === "3" || rank === "2") return up >= 2 && up <= 7 ? "I would split." : "I would hit.";
  }

  if (hasSoftAce(playerCards) && playerCards.length >= 2) {
    if (total >= 19) return "I would stand.";
    if (total === 18) {
      if (up >= 3 && up <= 6 && playerCards.length === 2) return "You should double.";
      if (up === 2 || up === 7 || up === 8) return "I would stand.";
      return "I would hit.";
    }
    if (total === 17 || total === 16) {
      if (up >= 4 && up <= 6 && playerCards.length === 2) return "You should double.";
      return "I would hit.";
    }
    if (total === 15 || total === 14 || total === 13) {
      if ((up === 5 || up === 6) && playerCards.length === 2) return "You should double.";
      return "I would hit.";
    }
  }

  if (total >= 17) return "I would stand.";
  if (total >= 13 && total <= 16) return up >= 2 && up <= 6 ? "I would stand." : "I would hit.";
  if (total === 12) return up >= 4 && up <= 6 ? "I would stand." : "I would hit.";
  if (total === 11) return playerCards.length === 2 ? "You should double." : "I would hit.";
  if (total === 10) return up >= 2 && up <= 9 && playerCards.length === 2 ? "You should double." : "I would hit.";
  if (total === 9) return up >= 3 && up <= 6 && playerCards.length === 2 ? "You should double." : "I would hit.";
  return "I would hit.";
}

function actorLine(name: string, action: "hit" | "stand") {
  if (name === "Hank" || name === "Alice") {
    return action === "hit" ? `${name}: "Hit."` : `${name}: "Stay."`;
  }
  if (name === "Robert") {
    if (action === "hit") {
      return Math.random() < 0.5 ? 'Robert: "I\'m a hitter not a quitter."' : 'Robert: "Gotta hit."';
    }
    return 'Robert: "Gotta stay."';
  }
  if (name === "Roth") {
    return action === "hit" ? 'Roth: "Hit."' : 'Roth: "*waves his hand to stay*"';
  }
  if (name === "You") {
    return action === "hit" ? 'You: "Hit me."' : 'You: "I\'ll stay."';
  }
  return action === "hit" ? `${name}: "Hit."` : `${name}: "Stand."`;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function getFlagsForName(name: string) {
  return CHARACTER_FLAGS[normalizeName(name)] ?? "";
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeRandoIdentity() {
  const profile = pick(RANDO_COUNTRIES);
  const first = pick(profile.firstNames);
  const last = pick(profile.lastNames);
  return {
    country: profile.country,
    name: `${first} ${last}`,
    flags: profile.flag,
  };
}

function makeRandoIdentityForCountry(country: string) {
  const profile = RANDO_COUNTRIES.find((c) => c.country === country) ?? pick(RANDO_COUNTRIES);
  const first = pick(profile.firstNames);
  const last = pick(profile.lastNames);
  return {
    country: profile.country,
    name: `${first} ${last}`,
    flags: profile.flag,
  };
}

function isPlayerToken(token: string | undefined) {
  return !!token && token.startsWith("player:");
}

function playerTokenIndex(token: string | undefined) {
  if (!isPlayerToken(token)) return -1;
  const idx = Number((token ?? "").split(":")[1]);
  return Number.isFinite(idx) ? idx : -1;
}

function chipBreakdown(amount: number) {
  let remaining = Number(amount.toFixed(2));
  if (remaining <= 0) return [];
  const picks: Array<{ value: number; color: string; ring: string }> = [];

  CHIP_DENOMS.forEach((chip) => {
    while (remaining + 0.001 >= chip.value && picks.length < 5) {
      picks.push(chip);
      remaining = Number((remaining - chip.value).toFixed(2));
    }
  });

  return picks;
}

function CardBack({ scarletCutCard, size = "small" }: { scarletCutCard?: boolean; size?: "small" | "large" }) {
  const monogramSvg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <text x="16" y="22" text-anchor="middle" font-size="19" font-family="'Times New Roman', Garamond, Georgia, serif" font-weight="700" fill="none" stroke="rgba(177,0,44,0.16)" stroke-width="0.55">R</text>
      <text x="16" y="22" text-anchor="middle" font-size="19" font-family="'Times New Roman', Garamond, Georgia, serif" font-weight="700" fill="rgba(177,0,44,0.28)">R</text>
    </svg>`,
  );

  const sizeClass = size === "large" ? "w-9 h-14 sm:w-12 sm:h-[74px]" : "w-6 h-9 sm:w-8 sm:h-12";

  return (
    <div
      className={[
        sizeClass,
        "rounded-lg border shadow-sm relative overflow-hidden",
        scarletCutCard
          ? "border-[#ff9cb5] bg-gradient-to-br from-[#ff4a77] via-[#cc0033] to-[#7e001f]"
          : "border-[#c8c8c8] bg-gradient-to-b from-[#ffffff] to-[#f2f2f2]",
      ].join(" ")}
      title={scarletCutCard ? "Scarlet cut card" : "Card back"}
    >
      {!scarletCutCard && (
        <>
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage: `url("data:image/svg+xml,${monogramSvg}")`,
              backgroundSize: "14px 14px",
            }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="w-4 h-4 rounded-full border border-[#b1002c]/35 bg-white/70 grid place-items-center">
              <span className="text-[#b1002c] text-[9px] font-black leading-none font-serif">R</span>
            </div>
          </div>
          <div className="absolute inset-[4px] rounded-md border border-[#b1002c]/20" />
        </>
      )}
    </div>
  );
}

function CardFace({ card, hidden, size = "small" }: { card: Card; hidden?: boolean; size?: "small" | "large" }) {
  if (hidden) return <CardBack size={size} />;
  const red = isRed(card.suit);
  const sizeClass = size === "large" ? "w-9 h-14 sm:w-12 sm:h-[74px]" : "w-6 h-9 sm:w-8 sm:h-12";
  return (
    <div
      title={`${card.rank}${card.suit}`}
      className={`${sizeClass} rounded-lg border border-[#dadada] shadow-sm bg-gradient-to-b from-[#ffffff] to-[#f8f8f8] flex flex-col items-center justify-center gap-0`}
    >
      <div className={[size === "large" ? "text-[13px]" : "text-[10px]", "font-bold leading-none", red ? "text-red-700" : "text-zinc-900"].join(" ")}>{card.rank}</div>
      <div className={[size === "large" ? "text-[14px]" : "text-[11px]", "leading-none", red ? "text-red-700" : "text-zinc-900"].join(" ")}>{card.suit}</div>
    </div>
  );
}

function ChipButton({ label, color, ring, onClick, disabled }: { label: string; color: string; ring: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative h-9 w-9 rounded-full border border-black text-[10px] font-black shadow-[0_3px_8px_rgba(0,0,0,0.25)] transition hover:-translate-y-[1px] disabled:opacity-45 overflow-hidden"
      style={{
        backgroundColor: color,
        color: ring,
        backgroundImage: "repeating-conic-gradient(#ffffff 0deg 14deg, #111111 14deg 28deg)",
      }}
    >
      <span className="absolute inset-[3px] rounded-full border border-black bg-white/60" />
      <span
        className="absolute inset-[6px] rounded-full border-2"
        style={{ borderColor: ring, backgroundColor: color }}
      />
      <span className="absolute inset-[10px] rounded-full border border-white/85" />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function ChipStack({ amount }: { amount: number }) {
  const chips = chipBreakdown(amount);
  if (chips.length === 0) return null;
  return (
    <div className="relative h-4 w-12">
      {chips.map((chip, idx) => (
        <span
          key={`${chip.value}-${idx}`}
          className="absolute top-0 h-3.5 w-3.5 rounded-full border border-black"
          style={{
            left: `${idx * 7}px`,
            backgroundImage: "repeating-conic-gradient(#ffffff 0deg 14deg, #101010 14deg 28deg)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          }}
        >
          <span className="absolute inset-[2px] rounded-full border border-black/35 bg-white/65" />
          <span
            className="absolute inset-[4px] rounded-full border"
            style={{ borderColor: chip.ring, backgroundColor: chip.color }}
          />
        </span>
      ))}
    </div>
  );
}

function DrinkIcon({ drink, size = "small" }: { drink: DrinkKey; size?: "small" | "large" }) {
  const sizeClass = size === "large" ? "h-10 w-10" : "h-7 w-7";
  return (
    <img
      src={DRINK_IMAGE_SRC[drink]}
      alt={`${DRINK_LABELS[drink]} icon`}
      className={`${sizeClass} object-contain`}
      loading="lazy"
    />
  );
}

export function RoxaneBlackjack() {
  const [shoe, setShoe] = React.useState<Card[]>(() => makeShoe(SHOE_DECKS));
  const [cutCardSeen, setCutCardSeen] = React.useState(false);
  const [needsReshuffle, setNeedsReshuffle] = React.useState(false);
  const [buddiesCount, setBuddiesCount] = React.useState<number | null>(null);
  const [playerName, setPlayerName] = React.useState("You");
  const [setupName, setSetupName] = React.useState("");
  const [setupPlayers, setSetupPlayers] = React.useState(4);
  const [bankroll, setBankroll] = React.useState(STARTING_BANKROLL);
  const [playerBet, setPlayerBet] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("betting");
  const [message, setMessage] = React.useState("Welcome to ROXANE.");
  const [dialogue, setDialogue] = React.useState("");
  const [brokeOutcome, setBrokeOutcome] = React.useState("");
  const [drinkMenuOpen, setDrinkMenuOpen] = React.useState(false);
  const [orderedDrink, setOrderedDrink] = React.useState<DrinkKey | null>(null);
  const [occupants, setOccupants] = React.useState<Occupant[]>([]);
  const [roundSeats, setRoundSeats] = React.useState<RoundSeat[]>([]);
  const [playerHands, setPlayerHands] = React.useState<PlayerHandState[]>([]);
  const [dealerHand, setDealerHand] = React.useState<Card[]>([]);
  const [hideDealerHole, setHideDealerHole] = React.useState(true);
  const [turnQueue, setTurnQueue] = React.useState<string[]>([]);

  const seatCapacity = MAX_SEATS - 1;
  const setupComplete = buddiesCount !== null;
  const availableFriendNames = React.useMemo(() => {
    const used = new Set<string>([normalizeName(playerName), ...occupants.map((o) => normalizeName(o.name))]);
    return CHARACTER_NAMES.filter((name) => !used.has(normalizeName(name)));
  }, [occupants, playerName]);

  function rosterForRound() {
    const assigned: RoundSeat[] = [
      {
        id: "player",
        seatIndex: 1,
        name: playerName,
        kind: "player",
        flags: getFlagsForName(playerName),
        hand: [],
        bet: playerBet,
        stood: false,
        busted: false,
        blackjack: false,
      },
    ];

    occupants.forEach((occupant, idx) => {
      const seatIndex = NON_PLAYER_SEAT_ORDER[idx] ?? NON_PLAYER_SEAT_ORDER[NON_PLAYER_SEAT_ORDER.length - 1];
      assigned.push({
        id: occupant.id,
        seatIndex,
        name: occupant.name,
        kind: occupant.kind,
        flags: occupant.flags,
        hand: [],
        bet: TABLE_MIN,
        stood: false,
        busted: false,
        blackjack: false,
      });
    });

    return assigned;
  }

  const seatsByIndex = React.useMemo(() => {
    const map = new Map<number, RoundSeat>();
    roundSeats.forEach((seat) => map.set(seat.seatIndex, seat));

    if (phase === "betting") {
      const roster = rosterForRound();
      roster.forEach((seat) => {
        if (!map.has(seat.seatIndex)) map.set(seat.seatIndex, seat);
      });
    }

    return map;
  }, [roundSeats, phase, occupants, playerBet, playerName]);

  function applyTableSetup(totalPlayers: number, name: string) {
    const othersCount = Math.max(0, Math.min(seatCapacity, totalPlayers - 1));
    const resolvedPlayerName = name.trim() || "You";
    const friendPool = shuffle(CHARACTER_NAMES.filter(
      (charName) => normalizeName(charName) !== normalizeName(resolvedPlayerName),
    ));
    const friendCount = Math.min(MAX_FRIEND_SEATS, othersCount);
    const randoCount = othersCount - friendCount;
    const friendSeats = Array.from({ length: friendCount }, (_, idx) => ({
      id: `friend-${idx}`,
      name: "",
      kind: "friend" as const,
      flags: "",
    })).map((friend, idx) => {
      const friendName = friendPool[idx];
      if (friendName) {
        return { ...friend, name: friendName, flags: getFlagsForName(friendName) };
      }
      const r = makeRandoIdentity();
      return { ...friend, name: r.name, flags: r.flags };
    });
    const randoSeats = Array.from({ length: randoCount }, (_, idx) => {
      const r = makeRandoIdentity();
      return {
        id: `rando-${idx}`,
        name: r.name,
        kind: "rando" as const,
        flags: r.flags,
      };
    });
    const next = [...friendSeats, ...randoSeats];
    setPlayerName(resolvedPlayerName);
    setOccupants(next);
    setBuddiesCount(othersCount);
    setRoundSeats([]);
    setPlayerHands([]);
    setTurnQueue([]);
    setDialogue("");
    setBrokeOutcome("");
    setDrinkMenuOpen(false);
    setOrderedDrink(null);
    setPlayerBet(0);
    setMessage("Place your chips, then deal.");
  }

  function addFriend() {
    if (phase !== "betting") return;
    if (occupants.length >= seatCapacity) return;
    const friendCount = occupants.filter((o) => o.kind === "friend").length;
    if (friendCount >= MAX_FRIEND_SEATS) return;
    const nextFriendName = availableFriendNames[0];
    if (!nextFriendName) return;
    const nextIndex = occupants.length;
    setOccupants((prev) => [
      ...prev,
      {
        id: `friend-${nextIndex}-${Date.now()}`,
        name: nextFriendName,
        kind: "friend",
        flags: getFlagsForName(nextFriendName),
      },
    ]);
  }

  function addRando() {
    if (phase !== "betting") return;
    if (occupants.length >= seatCapacity) return;
    const randoCount = occupants.length;
    const r = makeRandoIdentity();
    setOccupants((prev) => [
      ...prev,
      {
        id: `rando-${randoCount}-${Date.now()}`,
        name: r.name,
        kind: "rando",
        flags: r.flags,
      },
    ]);
  }

  function startOgMode() {
    const brazil = makeRandoIdentityForCountry("Brazil");
    const nextOccupants: Occupant[] = [
      { id: "friend-og-hank", name: "Hank", kind: "friend", flags: getFlagsForName("Hank") },
      { id: "friend-og-robert", name: "Robert", kind: "friend", flags: getFlagsForName("Robert") },
      { id: "friend-og-alice", name: "Alice", kind: "friend", flags: getFlagsForName("Alice") },
      { id: "friend-og-roth", name: "Roth", kind: "friend", flags: getFlagsForName("Roth") },
      { id: "rando-og-brazil", name: brazil.name, kind: "rando", flags: "🇧🇷" },
    ];
    setOccupants(nextOccupants);
    setBuddiesCount(nextOccupants.length);
    setPhase("betting");
    setBankroll(STARTING_BANKROLL);
    setPlayerBet(0);
    setShoe(makeShoe(SHOE_DECKS));
    setCutCardSeen(false);
    setNeedsReshuffle(false);
    setRoundSeats([]);
    setPlayerHands([]);
    setDealerHand([]);
    setHideDealerHole(true);
    setTurnQueue([]);
    setDialogue("");
    setBrokeOutcome("");
    setDrinkMenuOpen(false);
    setOrderedDrink(null);
    setMessage("OG mode loaded. Place your chips, then deal.");
  }

  function addChip(value: number) {
    if (phase !== "betting") return;
    setPlayerBet((prev) => {
      const next = Number((prev + value).toFixed(2));
      if (next > bankroll) return prev;
      return next;
    });
  }

  function clearBet() {
    if (phase !== "betting") return;
    setPlayerBet(0);
  }

  function finalizeRound(seatState: RoundSeat[], dealerState: Card[], playerHandsState = playerHands) {
    const dealerTotal = handValue(dealerState);
    const dealerBusted = dealerTotal > 21;
    const dealerBlackjack = isBlackjack(dealerState);
    let bankrollDelta = 0;

    const nextSeats = seatState.map((seat) => {
      if (seat.kind === "player") return { ...seat };
      const total = handValue(seat.hand);
      const resultSeat = { ...seat };
      if (resultSeat.busted) {
        resultSeat.result = "BUST";
        if (resultSeat.kind === "player") bankrollDelta -= resultSeat.bet;
        return resultSeat;
      }
      if (resultSeat.blackjack && !dealerBlackjack) {
        resultSeat.result = "BLACKJACK";
        if (resultSeat.kind === "player") bankrollDelta += Number((resultSeat.bet * 1.5).toFixed(2));
        return resultSeat;
      }
      if (dealerBusted) {
        resultSeat.result = "WIN";
        if (resultSeat.kind === "player") bankrollDelta += resultSeat.bet;
        return resultSeat;
      }
      if (dealerBlackjack && !resultSeat.blackjack) {
        resultSeat.result = "LOSE";
        if (resultSeat.kind === "player") bankrollDelta -= resultSeat.bet;
        return resultSeat;
      }
      if (total > dealerTotal) {
        resultSeat.result = "WIN";
        if (resultSeat.kind === "player") bankrollDelta += resultSeat.bet;
        return resultSeat;
      }
      if (total < dealerTotal) {
        resultSeat.result = "LOSE";
        if (resultSeat.kind === "player") bankrollDelta -= resultSeat.bet;
        return resultSeat;
      }
      resultSeat.result = "PUSH";
      return resultSeat;
    });
    const nextPlayerHands = playerHandsState.map((hand) => {
      const total = handValue(hand.cards);
      const resultHand: PlayerHandState = { ...hand };
      if (resultHand.busted) {
        resultHand.result = "BUST";
        bankrollDelta -= resultHand.bet;
        return resultHand;
      }
      if (resultHand.blackjack && !dealerBlackjack) {
        resultHand.result = "BLACKJACK";
        bankrollDelta += Number((resultHand.bet * 1.5).toFixed(2));
        return resultHand;
      }
      if (dealerBusted) {
        resultHand.result = "WIN";
        bankrollDelta += resultHand.bet;
        return resultHand;
      }
      if (dealerBlackjack && !resultHand.blackjack) {
        resultHand.result = "LOSE";
        bankrollDelta -= resultHand.bet;
        return resultHand;
      }
      if (total > dealerTotal) {
        resultHand.result = "WIN";
        bankrollDelta += resultHand.bet;
        return resultHand;
      }
      if (total < dealerTotal) {
        resultHand.result = "LOSE";
        bankrollDelta -= resultHand.bet;
        return resultHand;
      }
      resultHand.result = "PUSH";
      return resultHand;
    });

    const playerSeatIdx = nextSeats.findIndex((seat) => seat.kind === "player");
    if (playerSeatIdx >= 0) {
      const summary = nextPlayerHands.map((hand, idx) => `H${idx + 1}:${hand.result ?? "—"}`).join(" ");
      nextSeats[playerSeatIdx] = { ...nextSeats[playerSeatIdx], result: summary };
    }
    const hankSeat = nextSeats.find((seat) => normalizeName(seat.name) === "hank");
    if (hankSeat && (hankSeat.result === "LOSE" || hankSeat.result === "BUST")) {
      setDialogue('Hank: "Nuts."');
    } else {
      setDialogue("");
    }
    setBrokeOutcome("");

    setBankroll((prev) => Number(Math.max(0, prev + bankrollDelta).toFixed(2)));
    setRoundSeats(nextSeats);
    setPlayerHands(nextPlayerHands);
    setHideDealerHole(false);
    setTurnQueue([]);
    setPhase("round_over");
    setMessage(dealerBusted ? "Roxane busts." : `Roxane shows ${dealerTotal}. Hand complete.`);
  }

  function startRound() {
    if (!setupComplete) return;
    if (bankroll < TABLE_MIN) {
      setMessage("You are below the $25 table minimum. Hit the ATM next.");
      return;
    }
    if (playerBet < TABLE_MIN) {
      setMessage("Minimum bet is $25.");
      return;
    }
    if (playerBet > bankroll) {
      setMessage("Your bet exceeds your bankroll.");
      return;
    }

    let workingShoe = shoe.slice();
    let nextCutCardSeen = cutCardSeen;

    if (needsReshuffle || workingShoe.length < 65) {
      workingShoe = makeShoe(SHOE_DECKS);
      nextCutCardSeen = false;
      setNeedsReshuffle(false);
      setMessage("Roxane reshuffled the shoe and gave a fresh cut.");
    }

    const roster = rosterForRound();
    const dealer: Card[] = [];

    for (let i = 0; i < 2; i += 1) {
      for (const seat of roster) {
        const drawn = drawFromShoe(workingShoe);
        if (drawn) seat.hand.push(drawn);
      }
      const d = drawFromShoe(workingShoe);
      if (d) dealer.push(d);
      if (!nextCutCardSeen && workingShoe.length <= CUT_CARD_THRESHOLD) nextCutCardSeen = true;
    }

    const marked = roster
      .map((seat) => {
        const blackjack = isBlackjack(seat.hand);
        return { ...seat, blackjack, stood: blackjack, busted: false, result: undefined };
      })
      .sort((a, b) => a.seatIndex - b.seatIndex);

    setShoe(workingShoe);
    setCutCardSeen(nextCutCardSeen);
    setRoundSeats(marked);
    setDealerHand(dealer);
    setHideDealerHole(true);
    const playerSeat = marked.find((seat) => seat.kind === "player");
    const initialPlayerHands: PlayerHandState[] = playerSeat
      ? [{
          cards: playerSeat.hand.slice(),
          bet: playerSeat.bet,
          stood: playerSeat.blackjack,
          busted: false,
          blackjack: playerSeat.blackjack,
          doubled: false,
          holeCardIndex: null,
          holeCardRevealed: true,
        }]
      : [];
    setPlayerHands(initialPlayerHands);

    const dealerUp = dealer[0];
    const dealerHasNatural = (dealerUp?.rank === "A" || getDealerUpValue(dealerUp) === 10) && isBlackjack(dealer);
    if (dealerHasNatural) {
      setHideDealerHole(false);
      setMessage("Roxane checks and has blackjack.");
      finalizeRound(marked, dealer, initialPlayerHands);
      return;
    }

    const queue = marked
      .filter((seat) => !seat.blackjack)
      .map((seat) => (seat.kind === "player" ? "player:0" : seat.id));
    setTurnQueue(queue);
    setPhase("in_round");
    setDialogue("");

    if (playerSeat && playerSeat.blackjack) {
      setMessage("Blackjack for you. Click Next Card to run the table.");
    } else {
      setMessage("Cards are out.");
    }
  }

  function nextCard() {
    if (phase !== "in_round") return;

    let workingShoe = shoe.slice();
    let nextCutCardSeen = cutCardSeen;
    let seats = roundSeats.map((seat) => ({ ...seat, hand: seat.hand.slice() }));
    let queue = turnQueue.slice();
    let dealer = dealerHand.slice();

    if (queue.length > 0) {
      const activeId = queue[0];
      if (isPlayerToken(activeId)) {
        const activeHandIdx = playerTokenIndex(activeId);
        const activeHand = activeHandIdx >= 0 ? playerHands[activeHandIdx] : undefined;
        if (activeHand) {
          setDialogue(`Roxane: You have ${handValue(activeHand.cards)}.`);
        }
        setMessage("Your turn. Choose Hit, Stand, Double, Split, or Ask Roxane.");
        return;
      }
      const idx = seats.findIndex((seat) => seat.id === activeId);
      if (idx < 0) {
        queue = queue.slice(1);
        setTurnQueue(queue);
        return;
      }

      const seat = seats[idx];
      if (seat.stood || seat.busted || seat.blackjack) {
        queue = queue.slice(1);
      } else {
        const advice = getBookAdvice(seat.hand, dealer[0]);
        const wantsHit = advice.includes("hit") || advice.includes("double");

        if (wantsHit) {
          const drawn = drawFromShoe(workingShoe);
          if (drawn) {
            seat.hand.push(drawn);
            if (!nextCutCardSeen && workingShoe.length <= CUT_CARD_THRESHOLD) nextCutCardSeen = true;
          }
          const total = handValue(seat.hand);
          if (total >= 21) {
            seat.stood = true;
            seat.busted = total > 21;
            queue = queue.slice(1);
          }
          setDialogue(actorLine(seat.name, "hit"));
          setMessage(`${seat.name} acted.`);
        } else {
          seat.stood = true;
          queue = queue.slice(1);
          setDialogue(actorLine(seat.name, "stand"));
          setMessage(`${seat.name} acted.`);
        }
      }

      setRoundSeats(seats);
      setTurnQueue(queue);
      setShoe(workingShoe);
      setCutCardSeen(nextCutCardSeen);
      return;
    }

    if (hideDealerHole) {
      setHideDealerHole(false);
      setDealerHand(dealer);
      setMessage("Roxane reveals her hole card.");
      return;
    }

    while (dealer.length < 2) {
      const d = drawFromShoe(workingShoe);
      if (!d) break;
      dealer.push(d);
    }

    const dealerTotal = handValue(dealer);
    if (dealerTotal < 17) {
      const drawn = drawFromShoe(workingShoe);
      if (drawn) {
        dealer.push(drawn);
        setMessage("Dealer hand advances.");
      }
      if (!nextCutCardSeen && workingShoe.length <= CUT_CARD_THRESHOLD) nextCutCardSeen = true;
      setDealerHand(dealer);
      setShoe(workingShoe);
      setCutCardSeen(nextCutCardSeen);
      return;
    }

    setDealerHand(dealer);
    setShoe(workingShoe);
    setCutCardSeen(nextCutCardSeen);
    setNeedsReshuffle(nextCutCardSeen || workingShoe.length < 48);
    const hasHiddenDouble = playerHands.some((hand) => hand.holeCardIndex !== null && !hand.holeCardRevealed);
    if (hasHiddenDouble) {
      const revealedHands = playerHands.map((hand) => ({ ...hand, holeCardRevealed: true }));
      setPlayerHands(revealedHands);
      setMessage("Roxane reveals the double-down cards.");
      finalizeRound(seats, dealer, revealedHands);
      return;
    }
    finalizeRound(seats, dealer);
  }

  function playerHit() {
    if (phase !== "in_round") return;
    const activeIdx = playerTokenIndex(turnQueue[0]);
    if (activeIdx < 0) return;

    const workingShoe = shoe.slice();
    let nextCutCardSeen = cutCardSeen;
    const hands = playerHands.map((hand) => ({ ...hand, cards: hand.cards.slice() }));
    const queue = turnQueue.slice();
    const hand = hands[activeIdx];
    if (!hand || hand.stood || hand.busted) return;

    const drawn = drawFromShoe(workingShoe);
    if (drawn) {
      hand.cards.push(drawn);
      if (!nextCutCardSeen && workingShoe.length <= CUT_CARD_THRESHOLD) nextCutCardSeen = true;
    }
    const total = handValue(hand.cards);
    if (total >= 21) {
      hand.stood = true;
      hand.busted = total > 21;
      queue.shift();
    }

    setDialogue(`Roxane: You have ${total}.`);
    setMessage("You acted.");
    setPlayerHands(hands);
    setTurnQueue(queue);
    setShoe(workingShoe);
    setCutCardSeen(nextCutCardSeen);
  }

  function playerStand() {
    if (phase !== "in_round") return;
    const activeIdx = playerTokenIndex(turnQueue[0]);
    if (activeIdx < 0) return;
    const hands = playerHands.map((hand) => ({ ...hand, cards: hand.cards.slice() }));
    const hand = hands[activeIdx];
    if (!hand) return;
    hand.stood = true;
    const queue = turnQueue.slice(1);
    setDialogue(`Roxane: You have ${handValue(hand.cards)}.`);
    setMessage("You acted.");
    setPlayerHands(hands);
    setTurnQueue(queue);
  }

  function playerDouble() {
    if (phase !== "in_round") return;
    const activeIdx = playerTokenIndex(turnQueue[0]);
    if (activeIdx < 0) return;
    const exposure = playerHands.reduce((sum, hand) => sum + hand.bet, 0);
    const hands = playerHands.map((hand) => ({ ...hand, cards: hand.cards.slice() }));
    const hand = hands[activeIdx];
    if (!hand || hand.cards.length !== 2 || hand.doubled || hand.stood || hand.busted) return;
    if (exposure + hand.bet > bankroll) return;

    const workingShoe = shoe.slice();
    let nextCutCardSeen = cutCardSeen;
    hand.bet += hand.bet;
    hand.doubled = true;
    const drawn = drawFromShoe(workingShoe);
    if (drawn) {
      hand.cards.push(drawn);
      if (!nextCutCardSeen && workingShoe.length <= CUT_CARD_THRESHOLD) nextCutCardSeen = true;
    }
    hand.holeCardIndex = hand.cards.length - 1;
    hand.holeCardRevealed = false;
    const total = handValue(hand.cards);
    hand.stood = true;
    hand.busted = total > 21;

    const queue = turnQueue.slice(1);
    setDialogue(`${playerName}: "Double."`);
    setMessage("You doubled.");
    setPlayerHands(hands);
    setTurnQueue(queue);
    setShoe(workingShoe);
    setCutCardSeen(nextCutCardSeen);
  }

  function playerSplit() {
    if (phase !== "in_round") return;
    const activeIdx = playerTokenIndex(turnQueue[0]);
    if (activeIdx !== 0) return;
    const hands = playerHands.map((hand) => ({ ...hand, cards: hand.cards.slice() }));
    const hand = hands[0];
    if (!hand || hands.length !== 1 || hand.cards.length !== 2) return;
    if (hand.cards[0].rank !== hand.cards[1].rank) return;
    if (hand.bet * 2 > bankroll) return;

    const workingShoe = shoe.slice();
    let nextCutCardSeen = cutCardSeen;
    const first: PlayerHandState = {
      cards: [hand.cards[0]],
      bet: hand.bet,
      stood: false,
      busted: false,
      blackjack: false,
      doubled: false,
      holeCardIndex: null,
      holeCardRevealed: true,
    };
    const second: PlayerHandState = {
      cards: [hand.cards[1]],
      bet: hand.bet,
      stood: false,
      busted: false,
      blackjack: false,
      doubled: false,
      holeCardIndex: null,
      holeCardRevealed: true,
    };
    const d1 = drawFromShoe(workingShoe);
    const d2 = drawFromShoe(workingShoe);
    if (d1) first.cards.push(d1);
    if (d2) second.cards.push(d2);
    if (!nextCutCardSeen && workingShoe.length <= CUT_CARD_THRESHOLD) nextCutCardSeen = true;

    const nextHands = [first, second];
    const queue = ["player:0", "player:1", ...turnQueue.slice(1)];
    setDialogue(`${playerName}: "Split."`);
    setMessage("You split your hand.");
    setPlayerHands(nextHands);
    setTurnQueue(queue);
    setShoe(workingShoe);
    setCutCardSeen(nextCutCardSeen);
  }

  function nextHand() {
    setPhase("betting");
    setRoundSeats([]);
    setPlayerHands([]);
    setDealerHand([]);
    setHideDealerHole(true);
    setTurnQueue([]);
    setDialogue("");
    setBrokeOutcome("");
    setPlayerBet(0);
    if (needsReshuffle) {
      setShoe(makeShoe(SHOE_DECKS));
      setCutCardSeen(false);
      setNeedsReshuffle(false);
      setMessage("Fresh shoe is in. Place your chips.");
    } else {
      setMessage("Place your chips for the next hand.");
    }
  }

  function hitAtm() {
    setBuddiesCount(null);
    setPlayerName("You");
    setSetupName("");
    setSetupPlayers(4);
    setOccupants([]);
    setBankroll(STARTING_BANKROLL);
    setPlayerBet(0);
    setShoe(makeShoe(SHOE_DECKS));
    setCutCardSeen(false);
    setNeedsReshuffle(false);
    setPhase("betting");
    setRoundSeats([]);
    setPlayerHands([]);
    setDealerHand([]);
    setHideDealerHole(true);
    setTurnQueue([]);
    setDialogue("");
    setBrokeOutcome("");
    setDrinkMenuOpen(false);
    setOrderedDrink(null);
    setMessage("Welcome to ROXANE.");
  }

  function orderDrink(drink: DrinkKey) {
    setOrderedDrink(drink);
    setDrinkMenuOpen(false);
    setMessage(`You ordered ${DRINK_LABELS[drink]}.`);
  }

  function askRobertForChip() {
    if (!setupComplete || bankroll > 0) return;
    const success = Math.random() < 0.25;
    if (success) {
      setBankroll(25);
      setPlayerBet(0);
      setPhase("betting");
      setRoundSeats([]);
      setPlayerHands([]);
      setDealerHand([]);
      setHideDealerHole(true);
      setTurnQueue([]);
      setDialogue('Robert: "I got you."');
      setBrokeOutcome("");
      setMessage("Robert slid you a $25 chip. Place your bet.");
      return;
    }
    setBrokeOutcome('Robert: "Sorry, not this time."');
    setMessage("No chip this time.");
  }

  function askBook() {
    const activeIdx = playerTokenIndex(turnQueue[0]);
    if (phase !== "in_round" || activeIdx < 0) return;
    const activeHand = playerHands[activeIdx];
    const dealerUp = dealerHand[0];
    const advice = getBookAdvice(activeHand?.cards ?? [], dealerUp);
    setDialogue(`Roxane: ${advice}`);
  }

  const canAddSeat = occupants.length < seatCapacity;
  const friendCount = occupants.filter((o) => o.kind === "friend").length;
  const canAddFriend = canAddSeat && friendCount < MAX_FRIEND_SEATS && availableFriendNames.length > 0;
  const currentTurnId = phase === "in_round" ? turnQueue[0] : undefined;
  const activePlayerHandIdx = playerTokenIndex(currentTurnId);
  const activePlayerHand = activePlayerHandIdx >= 0 ? playerHands[activePlayerHandIdx] : undefined;
  const isPlayerTurn = activePlayerHandIdx >= 0;
  const canAdvanceNpc = phase === "in_round" && (!currentTurnId || !isPlayerTurn);
  const playerExposure = playerHands.reduce((sum, hand) => sum + hand.bet, 0);
  const canDouble = isPlayerTurn
    && !!activePlayerHand
    && activePlayerHand.cards.length === 2
    && !activePlayerHand.doubled
    && !activePlayerHand.stood
    && !activePlayerHand.busted
    && playerExposure + activePlayerHand.bet <= bankroll;
  const canSplit = isPlayerTurn
    && playerHands.length === 1
    && !!activePlayerHand
    && activePlayerHand.cards.length === 2
    && activePlayerHand.cards[0].rank === activePlayerHand.cards[1].rank
    && playerExposure + activePlayerHand.bet <= bankroll;
  const shoePct = Math.max(0, Math.min(1, shoe.length / TOTAL_SHOE_CARDS));
  const showBrokeOverlay = setupComplete && bankroll <= 0;
  const robertDeclined = brokeOutcome === 'Robert: "Sorry, not this time."';

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-black tracking-tight text-[#7a001f]">ROXANE</h2>
        </div>
        <button
          type="button"
          onClick={hitAtm}
          className="rounded-xl border border-[#cc0033]/40 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a001f] opacity-80"
          title="Restart bankroll and current game state"
        >
          Hit the ATM
        </button>
      </div>

      <div className="rounded-3xl border border-[#5e0018]/55 bg-gradient-to-b from-[#d61b4d] via-[#b40033] to-[#8f0028] p-2 sm:p-4 shadow-inner">
        <div
          className="relative h-[500px] sm:h-[620px] overflow-hidden rounded-[22px] border border-white/15"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 12%, rgba(255,255,255,0.17), transparent 44%), radial-gradient(circle at 50% 96%, rgba(0,0,0,0.2), transparent 50%), url("data:image/svg+xml,${FELT_TEXTURE}")`,
          }}
        >
          <div className="absolute left-3 top-2 rounded-lg border border-white/20 bg-black/20 px-2 py-1 text-[11px] font-bold text-white/90">
            Bankroll: ${bankroll.toFixed(2)} · Table Min: ${TABLE_MIN}
          </div>

          <div className="absolute left-1/2 top-[14%] -translate-x-1/2 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/85">Dealer • Roxane 🇵🇪</p>
            <div className="mt-1 flex justify-center gap-1">
              {dealerHand.length === 0 && <CardBack />}
              {dealerHand.map((card, idx) => (
                <CardFace key={card.id} card={card} hidden={hideDealerHole && idx === 1 && phase !== "round_over"} />
              ))}
            </div>
          </div>

          {dialogue && (
            <div className="absolute left-1/2 top-[31%] z-10 w-[min(80%,430px)] -translate-x-1/2 rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-center text-[12px] font-semibold text-white/95">
              {dialogue}
            </div>
          )}

          <button
            type="button"
            onClick={startOgMode}
            className="absolute right-3 top-2 rounded-lg border border-white/20 bg-black/20 px-2 py-1 text-left text-white/85 transition hover:bg-black/30"
            title="OG table mode"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.08em]">Shoe</div>
            <div className="relative mt-1 h-6 w-[150px] overflow-hidden rounded-md border border-white/30 bg-black/20">
              {Array.from({ length: 24 }, (_, idx) => (
                <span
                  key={idx}
                  className="absolute top-0 h-full w-[6px] rounded-sm border border-black/20 bg-white/95"
                  style={{ left: `${idx * 6}px`, opacity: idx / 24 < shoePct ? 1 : 0.18 }}
                />
              ))}
              {cutCardSeen && (
                <span className="absolute right-3 top-0 h-full w-[6px] rounded-sm border border-[#ff9cb5] bg-[#cc0033]" />
              )}
            </div>
          </button>

          {Array.from({ length: MAX_SEATS }, (_, idx) => {
            const seat = seatsByIndex.get(idx);
            const pos = SEAT_POSITIONS[idx];
            const seatIsPlayer = seat?.kind === "player";
            const cardSize = seatIsPlayer ? "large" : "small";
            return (
              <div
                key={`seat-${idx}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: pos.left, top: pos.top }}
              >
                {seat ? (
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/90">
                      {seat.name}{seat.flags ? ` ${seat.flags}` : ""}
                    </p>
                    {seat.kind === "player" && playerHands.length > 0 ? (
                      <div className="mt-0.5 space-y-1">
                        {playerHands.map((hand, handIdx) => (
                          <div
                            key={`${seat.id}-h${handIdx}`}
                            className={[
                              "flex items-center justify-center gap-2 rounded-md px-1 py-0.5 transition",
                              isPlayerTurn && activePlayerHandIdx === handIdx
                                ? "ring-2 ring-white/90 shadow-[0_0_16px_rgba(255,255,255,0.55)] bg-white/10"
                                : "",
                            ].join(" ")}
                          >
                            <div className="flex min-h-[40px] justify-center gap-1">
                              {hand.cards.map((card, cardIdx) => (
                                <CardFace
                                  key={card.id}
                                  card={card}
                                  size={cardSize}
                                  hidden={hand.holeCardIndex === cardIdx && !hand.holeCardRevealed && phase === "in_round"}
                                />
                              ))}
                            </div>
                            <ChipStack amount={hand.bet} />
                            <p className="text-[10px] font-bold text-white/92">${hand.bet.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="mt-0.5 flex items-center justify-center gap-2">
                          <div className="flex min-h-[40px] justify-center gap-1">
                            {seat.hand.length === 0 && <CardBack size={cardSize} />}
                            {seat.hand.map((card) => (
                              <CardFace key={card.id} card={card} size={cardSize} />
                            ))}
                          </div>
                          <ChipStack amount={seat.bet} />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] uppercase tracking-[0.08em] text-white/45">Empty</p>
                )}
              </div>
            );
          })}

          <div className="absolute left-1/2 bottom-3 z-10 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-white/25 bg-black/20 px-2 py-1.5">
                {CHIP_DENOMS.slice().reverse().map((chip) => (
                  <ChipButton
                    key={chip.label}
                    label={chip.label}
                    color={chip.color}
                    ring={chip.ring}
                    disabled={!setupComplete || phase !== "betting" || playerBet + chip.value > bankroll}
                    onClick={() => addChip(chip.value)}
                  />
                ))}
                <button
                  type="button"
                  disabled={!setupComplete || phase !== "betting"}
                  onClick={clearBet}
                  className="rounded-md border border-white/35 bg-black/25 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-45"
                >
                  Reset
                </button>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="flex flex-wrap justify-center gap-1.5">
                  <button
                    type="button"
                    disabled={!setupComplete || phase !== "betting"}
                    onClick={startRound}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      setupComplete && phase === "betting"
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Deal
                  </button>
                  <button
                    type="button"
                    disabled={!isPlayerTurn}
                    onClick={playerHit}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      isPlayerTurn
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Hit
                  </button>
                  <button
                    type="button"
                    disabled={!isPlayerTurn}
                    onClick={playerStand}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      isPlayerTurn
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Stand
                  </button>
                  <button
                    type="button"
                    disabled={!canDouble}
                    onClick={playerDouble}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      canDouble
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Double
                  </button>
                  <button
                    type="button"
                    disabled={!canSplit}
                    onClick={playerSplit}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      canSplit
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Split
                  </button>
                  <button
                    type="button"
                    disabled={!canAdvanceNpc}
                    onClick={nextCard}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      canAdvanceNpc
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Next Card
                  </button>
                  <button
                    type="button"
                    disabled={!isPlayerTurn}
                    onClick={askBook}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      isPlayerTurn
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Ask Roxane
                  </button>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <button
                    type="button"
                    disabled={!setupComplete || !canAddFriend || phase !== "betting"}
                    onClick={addFriend}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      setupComplete && canAddFriend && phase === "betting"
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Add Friend
                  </button>
                  <button
                    type="button"
                    disabled={!setupComplete || !canAddSeat || phase !== "betting"}
                    onClick={addRando}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      setupComplete && canAddSeat && phase === "betting"
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Add Rando
                  </button>
                  <button
                    type="button"
                    disabled={phase !== "round_over"}
                    onClick={nextHand}
                    className={[
                      "rounded-md border px-3 py-1.5 text-[12px] font-semibold disabled:opacity-45",
                      phase === "round_over"
                        ? "border-white/80 bg-white text-black"
                        : "border-white/30 bg-[#a4a4a4] text-black/90",
                    ].join(" ")}
                  >
                    Next Hand
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute right-3 bottom-3 z-10 w-[300px]">
            {orderedDrink && !drinkMenuOpen && (
              <div className="mb-2 ml-auto flex w-fit items-center gap-2 rounded-lg border border-[#b1002c]/35 bg-white px-2.5 py-1.5 text-[#8a0023] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                <DrinkIcon drink={orderedDrink} size="large" />
                <span className="text-[11px] font-semibold">{DRINK_LABELS[orderedDrink]}</span>
              </div>
            )}

            {drinkMenuOpen && (
              <div className="mb-2 rounded-xl border border-[#b1002c]/35 bg-white p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.32)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a0023]">Order a drink</p>
                <div className="mt-1.5 flex flex-col gap-1">
                  {DRINK_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => orderDrink(option.key)}
                      className="flex items-center gap-2 rounded-md border border-[#b1002c]/25 bg-white px-2 py-1.5 text-left text-[11px] font-semibold text-[#6e001b] transition hover:bg-[#fff6f8]"
                    >
                      <DrinkIcon drink={option.key} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setDrinkMenuOpen((prev) => !prev)}
              title={drinkMenuOpen ? "Close drink menu" : "Open drink menu"}
              className="ml-auto flex w-[156px] flex-col items-center gap-2 rounded-xl border border-[#b1002c]/35 bg-white px-2 py-2 text-[#8a0023] shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition hover:bg-[#fff7f9]"
            >
              <span className="grid h-28 w-full place-items-center overflow-hidden rounded-xl border border-[#b1002c]/30 bg-[#fff7f9]">
                <img
                  src="/images/waitress-vegas-waistup.png"
                  alt="Cartoon waitress holding a tray"
                  className="h-full w-full object-contain"
                  loading="eager"
                />
              </span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-center">Order a drink</span>
            </button>
          </div>

          {!setupComplete && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
              <div className="w-[min(92%,420px)] rounded-xl border border-white/25 bg-white p-4 text-black shadow-xl">
                <h3 className="text-[14px] font-black uppercase tracking-[0.08em] text-[#7a001f]">Join The Table</h3>
                <label className="mt-3 block text-[12px] font-semibold text-black/80">What&apos;s your name?</label>
                <input
                  type="text"
                  value={setupName}
                  onChange={(event) => setSetupName(event.target.value)}
                  className="mt-1 w-full rounded-md border border-black/20 px-2 py-1.5 text-[13px]"
                  placeholder="Enter your name"
                />
                <label className="mt-3 block text-[12px] font-semibold text-black/80">How many players total (including you)?</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {Array.from({ length: MAX_SEATS }, (_, i) => i + 1).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSetupPlayers(count)}
                      className={[
                        "rounded-md border px-2 py-1 text-[12px] font-bold",
                        setupPlayers === count
                          ? "border-[#cc0033]/60 bg-[#fff1f5] text-[#7a001f]"
                          : "border-black/20 bg-white text-black/75",
                      ].join(" ")}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => applyTableSetup(setupPlayers, setupName)}
                  className="mt-4 rounded-lg border border-[#cc0033]/50 bg-[#cc0033] px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white"
                >
                  Enter Table
                </button>
              </div>
            </div>
          )}

          {showBrokeOverlay && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
              <div className="w-[min(92%,460px)] rounded-xl border border-white/25 bg-white p-4 text-black shadow-xl">
                <h3 className="text-[14px] font-black uppercase tracking-[0.08em] text-[#7a001f]">You&apos;re out of chips</h3>
                <p className="mt-2 text-[13px] text-black/75">
                  {brokeOutcome || "Bankroll is at $0.00."}
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {!robertDeclined && (
                    <button
                      type="button"
                      onClick={askRobertForChip}
                      className="rounded-lg border border-[#cc0033]/50 bg-[#cc0033] px-3 py-2 text-[12px] font-bold text-white"
                    >
                      Hey, Robert, can I have a $25 chip? (25% chance of success)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={hitAtm}
                    className="rounded-lg border border-black/20 bg-white px-3 py-2 text-[12px] font-bold text-black/80"
                  >
                    {robertDeclined ? "Fine, okay" : "Quit"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {message}
        {needsReshuffle ? " Scarlet cut card is out. Shoe will reshuffle after this hand." : ""}
      </p>

    </section>
  );
}
