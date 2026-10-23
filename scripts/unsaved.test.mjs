import assert from "node:assert/strict";
import test from "node:test";
import {
  freshState,
  complete,
  mergeState,
  validateState,
  readSave,
  encodeState,
  decodeState,
  nextScene,
  canVisit,
  levels,
  startBoard,
  moveBoard,
  budget,
  endingFor,
} from "../public/unsaved/core.js";
import { sceneUrl } from "../public/unsaved/sites.js";

test("save token round-trips, dependencies reject skips, same-run merges do not lose progress", () => {
  const state = complete(freshState("test-run-001"), "start");
  const later = complete(state, "profiles");
  assert.deepEqual(decodeState(encodeState(later)), later);
  assert.deepEqual(mergeState(later, state), later);
  assert.throws(() => complete(state, "jam"));
  assert.throws(() => mergeState(state, freshState("another-run")));
  assert.throws(() => validateState({ ...state, flags: ["jam"] }));
  assert.throws(() => validateState({ ...state, version: 2 }));
  assert.throws(() => validateState({ ...state, url: "https://example.com" }));
  assert.throws(() => readSave("x".repeat(8193)));
  assert.throws(() => decodeState("<script>"));
  assert.equal(nextScene(later), "first");
  assert.equal(canVisit(later, "end"), false);
  assert.equal(canVisit(later, "room"), true);
});

test("hints merge by max and imported arrays are bounded", () => {
  const state = freshState("test-run-001");
  const merged = mergeState(
    { ...state, hints: { intro: 2 } },
    { ...state, hints: { intro: 1, first: 3 } },
  );
  assert.deepEqual(merged.hints, { intro: 2, first: 3 });
  for (const bad of [
    { flags: ["start", "start"] },
    { hints: { end: 4 } },
    { hints: [] },
    { seen: ["private"] },
    { endings: ["make"] },
  ]) {
    assert.throws(() => validateState({ ...state, ...bad }));
  }
});

function walk(level, moves, modules) {
  let board = startBoard(level);
  for (const direction of moves)
    board = moveBoard(level, board, direction, modules).board;
  return board;
}

test("first playable room: box powers latch and player reaches flag", () => {
  const board = walk(levels.first, [
    "down",
    "down",
    "right",
    "right",
    "down",
    "right",
    "right",
    "up",
    "right",
    "right",
    "up",
    "up",
  ]);
  assert.equal(board.powered, true);
  assert.equal(board.won, true);
  assert.equal(
    moveBoard(levels.first, startBoard(levels.first), "up").board.moves,
    0,
  );
});

test("jam is actually playable only with required modules within six slots", () => {
  const moves = Array(6).fill("right");
  assert.equal(budget(["move", "bridge", "goal", "undo"]), 6);
  assert.ok(budget(["move", "bridge", "goal", "boss"]) > 6);
  assert.equal(walk(levels.jam, moves, ["move", "bridge", "goal"]).won, true);
  for (const modules of [
    ["bridge", "goal"],
    ["move", "goal"],
    ["move", "bridge"],
  ]) {
    assert.equal(walk(levels.jam, moves, modules).won, false);
  }
});

test("all three endings have reachable final room and revisit-safe results", () => {
  assert.equal(endingFor(["flag", "tool"]), "make");
  assert.equal(endingFor(["margin", "flag"]), "share");
  assert.equal(endingFor(["tool", "margin"]), "space");
  assert.throws(() => endingFor(["tool", "tool"]));
  assert.equal(
    walk(levels.end, [
      "right",
      "right",
      "right",
      "right",
      "right",
      "right",
      "down",
      "down",
      "left",
      "down",
    ]).won,
    true,
  );
});

test("origins really differ in local play and arbitrary hosts cannot become destinations", () => {
  assert.equal(
    sceneUrl("intro", { hostname: "localhost" }),
    "http://localhost:4321/unsaved/",
  );
  assert.equal(
    sceneUrl("first", { hostname: "localhost" }),
    "http://localhost:4322/unsaved/first/",
  );
  assert.equal(
    sceneUrl("intro", { hostname: "malicious.example" }),
    "https://blog.sayori.org/unsaved/",
  );
});
