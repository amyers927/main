import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aiDecideDraw, bestMeldLayout, GinRummyPanel, makeDeck } from "./GinRummyPanel";
import { checkAnswer, findCategoryIndex, JeopardyTerminal, parseDollarValue, stripValueFromPick } from "./JeopardyTerminal";
import { handValue, isBlackjack, makeShoe, RoxaneBlackjack } from "./RoxaneBlackjack";

type Card = Parameters<typeof handValue>[0][number];
const card = (rank: Card["rank"], suit: Card["suit"] = "♠"): Card => ({ rank, suit, id: `${rank}${suit}` });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Gin Rummy", () => {
  it("deals a single complete deck and finds non-overlapping melds", () => {
    expect(new Set(makeDeck().map(c => c.id)).size).toBe(52);
    // The two runs must win over the overlapping set of 3s.
    const hand = [card("A"), card("2"), card("3"), card("3", "♥"), card("4", "♥"), card("5", "♥"), card("3", "♦")];
    const result = bestMeldLayout(hand);
    expect(result.deadwood).toBe(3);
    const used = result.melds.flatMap(m => m.cards.map(c => c.id));
    expect(used.length).toBe(new Set(used).size);
  });

  it("does not crash when every card is known and the stock is empty", () => {
    const deck = makeDeck();
    expect(aiDecideDraw({ aiHand: deck.slice(0, 10), discardTop: deck[10], knownDiscards: deck, stockSize: 0 })).toBe("discard");
  });

  it("completes a player draw/discard and a CPU turn, then resets safely", () => {
    vi.useFakeTimers();
    render(<GinRummyPanel />);
    expect(screen.getByRole("button", { name: "Discard" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Draw Stock" }));
    const playable = screen.getAllByRole("button").find(b => b.title.match(/^[A23456789JQK]|^10/) && !b.hasAttribute("disabled"));
    expect(playable).toBeDefined();
    fireEvent.click(playable!);
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByText("Computer is thinking…")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "New Hand" }));
    expect(screen.getByRole("button", { name: "Draw Stock" }).hasAttribute("disabled")).toBe(false);
  });
});

describe("ROXANE", () => {
  function seeded(seed: number) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function controlledDeal(pair = false) {
    for (let seed = 1; seed < 10_000; seed++) {
      const random = vi.spyOn(Math, "random").mockImplementation(seeded(seed));
      const shoe = makeShoe(6);
      const player = [shoe.pop()!, shoe[shoe.length - 2]];
      const dealer = [shoe.pop()!];
      shoe.pop();
      dealer.push(shoe.pop()!);
      if (!isBlackjack(player) && !isBlackjack(dealer) && (!pair || player.every(c => c.rank === "8"))) {
        random.mockImplementation(seeded(seed));
        return { shoe, player, dealer };
      }
      random.mockRestore();
    }
    throw new Error("No controlled deal found");
  }

  function enterAndDeal() {
    render(<RoxaneBlackjack />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter Table" }));
    fireEvent.click(screen.getByRole("button", { name: "25" }));
    fireEvent.click(screen.getByRole("button", { name: "Deal" }));
  }

  function finishDealer() {
    for (let i = 0; i < 25 && screen.getByRole("button", { name: "Next Hand" }).hasAttribute("disabled"); i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next Card" }));
    }
    expect(screen.getByRole("button", { name: "Next Hand" }).hasAttribute("disabled")).toBe(false);
  }

  function payout(total: number, dealer: number, bet: number) {
    return total > 21 ? -bet : dealer > 21 || total > dealer ? bet : total < dealer ? -bet : 0;
  }

  it("keeps all six decks distinct and values multiple aces correctly", () => {
    const shoe = makeShoe(6);
    expect(shoe).toHaveLength(312);
    expect(new Set(shoe.map(c => c.id)).size).toBe(312);
    expect(handValue([card("A"), card("A", "♥"), card("9")])).toBe(21);
    expect(handValue([card("A"), card("K"), card("Q")])).toBe(21);
    expect(isBlackjack([card("A"), card("K")])).toBe(true);
    expect(isBlackjack([card("A"), card("5"), card("5", "♥")])).toBe(false);
  });

  it("deals, completes and resets a round without changing the controls", () => {
    render(<RoxaneBlackjack />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter Table" }));
    fireEvent.click(screen.getByRole("button", { name: "25" }));
    fireEvent.click(screen.getByRole("button", { name: "Deal" }));
    for (let i = 0; i < 25; i++) {
      const nextHand = screen.getByRole("button", { name: "Next Hand" });
      if (!nextHand.hasAttribute("disabled")) break;
      const stand = screen.getByRole("button", { name: "Stand" });
      if (!stand.hasAttribute("disabled")) fireEvent.click(stand);
      else fireEvent.click(screen.getByRole("button", { name: "Next Card" }));
    }
    expect(screen.getByRole("button", { name: "Next Hand" }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Next Hand" }));
    expect(screen.getByRole("button", { name: "Deal" }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Hit the ATM" }));
    expect(screen.getByRole("button", { name: "Enter Table" })).toBeDefined();
  });

  it("doubles the bet once, draws one card, and settles the correct payout", () => {
    const { shoe, player, dealer } = controlledDeal();
    player.push(shoe.pop()!);
    while (handValue(dealer) < 17) dealer.push(shoe.pop()!);
    const expected = 400 + payout(handValue(player), handValue(dealer), 50);
    enterAndDeal();
    fireEvent.click(screen.getByRole("button", { name: "Double" }));
    expect(screen.getByRole("button", { name: "Double" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Hit" }).hasAttribute("disabled")).toBe(true);
    finishDealer();
    expect(screen.getByText(`Bankroll: $${expected.toFixed(2)} · Table Min: $25`)).toBeDefined();
  });

  it("plays both split hands and settles each bet separately", () => {
    const { shoe, player, dealer } = controlledDeal(true);
    const totals = [handValue([player[0], shoe.pop()!]), handValue([player[1], shoe.pop()!])];
    while (handValue(dealer) < 17) dealer.push(shoe.pop()!);
    const expected = 400 + totals.reduce((sum, total) => sum + payout(total, handValue(dealer), 25), 0);
    enterAndDeal();
    fireEvent.click(screen.getByRole("button", { name: "Split" }));
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    expect(screen.getByRole("button", { name: "Stand" }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    finishDealer();
    expect(screen.getByText(`Bankroll: $${expected.toFixed(2)} · Table Min: $25`)).toBeDefined();
  });
});

describe("Jeopardy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Leave the bundled demo loaded so tests do not download the real dataset.
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
  });

  function command(text: string) {
    const input = screen.getByPlaceholderText(/type a command/);
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: "Enter" });
  }

  function selectRegularClue() {
    // Daily Double locations are random; skip that clue if necessary.
    for (const value of [200, 400, 600, 800, 1000]) {
      command(`MORE DEMO for ${value}`);
      if (screen.queryByText(/Alex is reading/)) return;
      command("r");
    }
    throw new Error("No regular clue selected");
  }

  it("accepts normal responses and surnames, but rejects fragments of words", () => {
    expect(checkAnswer("What is Paris?", "Paris")).toBe(true);
    expect(checkAnswer("Shakespeare", "William Shakespeare")).toBe(true);
    expect(checkAnswer("s", "Shakespeare")).toBe(false);
    expect(checkAnswer("Ham", "Hamlet")).toBe(false);
    expect(checkAnswer("York", "Yorkshire")).toBe(false);
  });

  it("selects exact categories even when another category contains the same words", () => {
    expect(findCategoryIndex("DEMO", ["DEMO", "MORE DEMO"])).toBe(0);
    expect(findCategoryIndex("cat a", ["CAT A", "CAT B"])).toBe(0);
    expect(findCategoryIndex("Rivers", ["World Rivers", "American Rivers"])).toBeNull();
  });

  it("keeps numbers and the word 'for' inside category names", () => {
    expect(parseDollarValue("THE 1980s for $200")).toBe(200);
    expect(stripValueFromPick("THE 1980s for $200")).toBe("THE 1980s");
    expect(stripValueFromPick("FOR THE BIRDS for 400")).toBe("FOR THE BIRDS");
    expect(parseDollarValue("Rivers 600")).toBe(600);
    expect(stripValueFromPick("Rivers 600")).toBe("Rivers");
  });

  it("does not reopen the buzz window after quitting during the host reading", () => {
    render(<JeopardyTerminal />);
    command("start");
    selectRegularClue();
    command("q");
    act(() => vi.advanceTimersByTime(20_000));
    expect(screen.queryByText(/BUZZ!/)).toBeNull();
    expect(screen.queryByText(/didn’t buzz in time/)).toBeNull();
  });

  it("does not let an old clue interrupt a new board", () => {
    render(<JeopardyTerminal />);
    command("start");
    selectRegularClue();
    command("r");
    act(() => vi.advanceTimersByTime(20_000));
    expect(screen.queryByText(/BUZZ!/)).toBeNull();
  });

  it("clears the previous countdown when restarting during an open buzz window", () => {
    render(<JeopardyTerminal />);
    command("start");
    selectRegularClue();
    // Advancing in one-second steps lets React process the reading transition.
    for (let i = 0; i < 12 && !screen.queryByText(/BUZZ!/); i++) {
      act(() => vi.advanceTimersByTime(1_000));
    }
    expect(screen.getByText(/BUZZ!/)).toBeDefined();
    command("r");
    expect(screen.queryByText("5s")).toBeNull();
  });

  it("keeps the game responsive when the demo has no Double Jeopardy board", () => {
    render(<JeopardyTerminal />);
    command("start");
    for (const category of ["DEMO", "MORE DEMO", "CAT A", "CAT B", "CAT C", "CAT D"]) {
      for (const value of [200, 400, 600, 800, 1000]) {
        command(`${category} for ${value}`);
        const announcement = screen.getAllByText(/DAILY DOUBLE!|Alex is reading/).at(-1)!.textContent!;
        if (announcement.includes("DAILY DOUBLE!")) command("0");
        else {
          act(() => vi.advanceTimersByTime(12_000));
          command("b");
        }
        command("incorrect response");
        act(() => vi.advanceTimersByTime(0));
      }
    }
    command("next");
    expect(screen.getByText("Could not build round 2. Type load to retry loading the clue dataset.")).toBeDefined();
    command("r");
    expect(screen.getByText("ROUND 1 — demo")).toBeDefined();
  });

  it("plays both rounds, handles Daily Doubles, and deducts an unanswered Final wager", async () => {
    const categories = ["Astronomy", "History", "Science", "Geography", "Literature", "Music"];
    const rows = ["round\tcategory\tclue_value\tdaily_double_value\tanswer\tquestion\tair_date"];
    for (const round of [1, 2]) {
      for (const category of categories) {
        for (const value of [200, 400, 600, 800, 1000]) {
          rows.push(`${round}\t${category}\t${value * round}\t\tA short clue.\tKnown Answer\t2020-01-01`);
        }
      }
    }
    rows.push("3\tFinal category\t0\t\tThe final clue.\tFinal response\t2020-01-01");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, text: async () => rows.join("\n") })));
    await act(async () => { render(<JeopardyTerminal />); });
    command("start");
    let expectedScore = 0;
    for (const round of [1, 2]) {
      for (const category of categories) {
        for (const value of [200, 400, 600, 800, 1000]) {
          command(`${category} for ${value * round}`);
          const announcement = screen.getAllByText(/DAILY DOUBLE!|Alex is reading/).at(-1)!.textContent!;
          if (announcement.includes("DAILY DOUBLE!")) {
            command("0");
          } else {
            act(() => vi.advanceTimersByTime(12_000));
            command("buzz");
            expectedScore += value * round;
          }
          command("Known Answer");
          act(() => vi.advanceTimersByTime(0));
        }
      }
      if (round === 1) command("next");
    }
    expect(screen.getByText(/Type: final/)).toBeDefined();
    command("final");
    command("100");
    for (let i = 0; i < 30; i++) act(() => vi.advanceTimersByTime(1_000));
    expect(screen.getByText(`Game over. Final score: $${expectedScore - 100}`)).toBeDefined();
    expect(screen.getByText("Correct response: Final response")).toBeDefined();
  }, 30_000);
});
