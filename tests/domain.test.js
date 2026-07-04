import test from "node:test";
import assert from "node:assert/strict";

import {
  calculate,
  candidateMeldsFor,
  countDora,
  createStateFromMelds,
  nextDora,
  sanitizeRecentItems,
  validateTiles,
  validateState,
  winningTileCandidates,
  encodeShareState,
  decodeShareState,
} from "../src/domain.js";

function calc(partial) {
  return calculate(createStateFromMelds(partial));
}

function payload(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

const pinfuRonMelds = [
  { tiles: ["m1", "m2", "m3"] },
  { tiles: ["m4", "m5", "m6"] },
  { tiles: ["m2", "m3", "m4"] },
  { tiles: ["s6", "s7", "s8"] },
  { tiles: ["p6", "p6"] },
];

test("dora indicators wrap correctly", () => {
  assert.equal(nextDora("m9"), "m1");
  assert.equal(nextDora("p4"), "p5");
  assert.equal(nextDora("east"), "south");
  assert.equal(nextDora("north"), "east");
  assert.equal(nextDora("white"), "green");
  assert.equal(nextDora("red"), "white");
});

test("red five counts as normal dora and red dora", () => {
  assert.equal(countDora(["m5r", "m5"], ["m4"]), 3);
});

test("tile quantity validation catches five of a kind and duplicate red five", () => {
  assert.deepEqual(validateTiles(["m1", "m1", "m1", "m1", "m1"]), ["동일패 5장 이상: 1만이 5장입니다."]);
  assert.deepEqual(validateTiles(["m5r", "m5r"]), ["동일 수패 적5 2장 이상: 적5만이 2장입니다."]);
});

test("candidate melds include red-five variants when a 5 can appear", () => {
  const candidates = candidateMeldsFor("m3").map((candidate) => `${candidate.kind}:${candidate.tiles.join(",")}`);
  assert.equal(candidates.includes("sequence:m3,m4,m5"), true);
  assert.equal(candidates.includes("sequence:m3,m4,m5r"), true);
});

test("winning tile candidates keep red five separate from normal five", () => {
  const candidates = winningTileCandidates([
    { tiles: ["m3", "m4", "m5r"] },
    { tiles: ["m5", "m6", "m7"] },
    { tiles: ["east", "east"] },
  ]);
  assert.deepEqual(candidates, ["m3", "m4", "m5r", "m5", "m6", "m7", "east"]);
});

test("state validation catches absent win tile and invalid ippatsu", () => {
  const errors = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { ippatsu: true, none: false },
    melds: [{ tiles: ["m1", "m2", "m3"] }],
    winTile: "s1",
    doraIndicators: ["east"],
  }));
  assert.equal(errors.includes("화료패가 최종 손패에 없습니다."), true);
  assert.equal(errors.includes("일발은 리치 또는 더블리치가 있을 때만 선택할 수 있습니다."), true);
});

test("dora and ura indicators participate in visible tile quantity validation", () => {
  const errors = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m1", "m1", "m1"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["p5", "p6", "p7"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "east",
    doraIndicators: ["m1"],
  }));
  assert.equal(errors.includes("동일패 5장 이상: 1만이 5장입니다."), true);
});

test("chankan requires a sequence wait in the supported MVP forms", () => {
  const errors = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { chankan: true, none: false },
    melds: [
      { tiles: ["m1", "m1", "m1"] },
      { tiles: ["p2", "p2", "p2"] },
      { tiles: ["s3", "s3", "s3"] },
      { tiles: ["m4", "m5", "m6"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "s3",
    doraIndicators: ["p9"],
  }));
  assert.equal(errors.includes("창깡은 순자 대기에서만 선택할 수 있습니다."), true);
});

test("closed pinfu ron is 30 fu and scores 1000 for child 1 han", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 1);
  assert.equal(result.fu, 30);
  assert.equal(result.score.display, "1000점");
  assert.equal(result.yaku.some((item) => item.name === "핑후"), true);
});

test("pinfu tsumo is 20 fu and includes menzen tsumo", () => {
  const result = calc({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.fu, 20);
  assert.equal(result.yaku.some((item) => item.name === "멘젠쯔모"), true);
  assert.equal(result.yaku.some((item) => item.name === "핑후"), true);
});

test("ron shanpon does not count the completed triplet toward sanankou", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, none: false },
    melds: [
      { tiles: ["m1", "m1", "m1"] },
      { tiles: ["p2", "p2", "p2"] },
      { tiles: ["s3", "s3", "s3"] },
      { tiles: ["m4", "m5", "m6"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "s3",
    doraIndicators: ["p9"],
    uraIndicators: ["s9"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.yaku.some((item) => item.name === "삼암각"), false);
});

test("tsumo shanpon keeps closed triplets for sanankou", () => {
  const result = calc({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m1", "m1"] },
      { tiles: ["p2", "p2", "p2"] },
      { tiles: ["s3", "s3", "s3"] },
      { tiles: ["m4", "m5", "m6"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "s3",
    doraIndicators: ["p9"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.yaku.some((item) => item.name === "삼암각"), true);
});

test("chiitoi is fixed 25 fu", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, none: false },
    melds: [
      { tiles: ["m1", "m1"] },
      { tiles: ["m9", "m9"] },
      { tiles: ["p2", "p2"] },
      { tiles: ["p8", "p8"] },
      { tiles: ["s3", "s3"] },
      { tiles: ["s7", "s7"] },
      { tiles: ["red", "red"] },
    ],
    winTile: "red",
    doraIndicators: ["east"],
    uraIndicators: ["m1"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.fu, 25);
  assert.equal(result.yaku.some((item) => item.name === "치또이"), true);
});

test("chiitoi honroutou includes both yaku", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m1"] },
      { tiles: ["m9", "m9"] },
      { tiles: ["p1", "p1"] },
      { tiles: ["p9", "p9"] },
      { tiles: ["s1", "s1"] },
      { tiles: ["s9", "s9"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "east",
    doraIndicators: ["p2"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.yaku.some((item) => item.name === "치또이"), true);
  assert.equal(result.yaku.some((item) => item.name === "혼노두"), true);
});

test("open honitsu uses the reduced 2 han value", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m2", "m3"], open: true },
      { tiles: ["m4", "m5", "m6"], open: true },
      { tiles: ["m7", "m8", "m9"] },
      { tiles: ["east", "east", "east"] },
      { tiles: ["red", "red"] },
    ],
    winTile: "east",
    doraIndicators: ["p9"],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.yaku.find((item) => item.name === "혼일색"), { name: "혼일색", han: 2 });
});

test("open tanyao is accepted with kuitan", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m2", "m3", "m4"], open: true },
      { tiles: ["p3", "p4", "p5"], open: true },
      { tiles: ["s4", "s5", "s6"], open: true },
      { tiles: ["m6", "m7", "m8"], open: true },
      { tiles: ["p6", "p6"] },
    ],
    winTile: "p6",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.yaku.some((item) => item.name === "탕야오"), true);
});

test("riichi hand can score ura dora", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, none: false },
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
    uraIndicators: ["s7"],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.yaku.find((item) => item.name === "우라도라"), { name: "우라도라", han: 1 });
});

test("open all sequences with no yaku and only dora is rejected", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m2", "m3"], open: true },
      { tiles: ["p1", "p2", "p3"], open: true },
      { tiles: ["s7", "s8", "s9"], open: true },
      { tiles: ["m7", "m8", "m9"], open: true },
      { tiles: ["p6", "p6"] },
    ],
    winTile: "s9",
    doraIndicators: ["m9"],
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ["도라만 있고 일반 역이 없습니다."]);
});

test("30 fu 4 han is not rounded up to mangan", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, ippatsu: true, none: false },
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["s7"],
    uraIndicators: ["p9"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 4);
  assert.equal(result.fu, 30);
  assert.equal(result.score.limitName, null);
  assert.equal(result.score.display, "7700점");
});

test("5 han result hides fu and uses mangan limit", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, ippatsu: true, none: false },
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["p5"],
    uraIndicators: ["p9"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 5);
  assert.equal(result.fu, null);
  assert.equal(result.score.limitName, "만관");
});

test("13 han is displayed as kazoe yakuman limit", () => {
  const result = calc({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, none: false },
    melds: [
      { tiles: ["m2", "m3", "m4"] },
      { tiles: ["m2", "m3", "m4"] },
      { tiles: ["m5", "m6", "m7"] },
      { tiles: ["m5", "m6", "m7"] },
      { tiles: ["m8", "m8"] },
    ],
    winTile: "m7",
    doraIndicators: ["east"],
    uraIndicators: ["south"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 13);
  assert.equal(result.score.limitName, "카조에역만");
});

test("yakuman is detected and not scored", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["white", "white", "white"] },
      { tiles: ["green", "green", "green"] },
      { tiles: ["red", "red", "red"] },
      { tiles: ["east", "east", "east"] },
      { tiles: ["south", "south"] },
    ],
    winTile: "south",
    doraIndicators: ["m1"],
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].startsWith("역만 손패입니다."), true);
});

test("churen poutou is detected as yakuman and not scored", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m1", "m1"] },
      { tiles: ["m2", "m3", "m4"] },
      { tiles: ["m5", "m5"] },
      { tiles: ["m6", "m7", "m8"] },
      { tiles: ["m9", "m9", "m9"] },
    ],
    winTile: "m5",
    doraIndicators: ["p2"],
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].includes("구련보등"), true);
});

test("share state round-trips through URL-safe payload", () => {
  const state = createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [{ tiles: ["m1", "m2", "m3"] }],
    winTile: "m3",
    doraIndicators: ["p1"],
  });
  const decoded = decodeShareState(encodeShareState(state));
  assert.equal(decoded.winMethod, "ron");
  assert.equal(decoded.melds[0].tiles.join(","), "m1,m2,m3");
  assert.equal(decoded.doraIndicators[0], "p1");
});

test("share state parser allowlists fields and drops unknown melds", () => {
  const decoded = decodeShareState(payload({
    v: 1,
    winMethod: "script",
    roundWind: "north-east",
    seatWind: "west",
    honba: -3,
    riichiSticks: 2.5,
    situation: { riichi: "yes", none: false },
    melds: [
      { tiles: ["m1", "evil"], open: true },
      { tiles: ["m1", "m2", "m3"], open: true },
    ],
    winTile: "evil",
    doraIndicators: ["m1", "evil", "p1"],
  }));
  assert.equal(decoded.winMethod, null);
  assert.equal(decoded.roundWind, "east");
  assert.equal(decoded.seatWind, "west");
  assert.equal(decoded.honba, 0);
  assert.equal(decoded.riichiSticks, 0);
  assert.equal(decoded.melds.length, 1);
  assert.equal(decoded.melds[0].open, true);
  assert.equal(decoded.winTile, null);
  assert.deepEqual(decoded.doraIndicators, ["m1", null, "p1", null, null]);
});

test("recent item sanitizer keeps only restorable valid calculations", () => {
  const goodState = createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  });
  const items = sanitizeRecentItems([
    { label: "ok", at: "2026-07-04T00:00:00.000Z", state: goodState },
    { label: "bad", state: { winMethod: "ron" } },
    { label: 42, state: goodState },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].label, "ok");
  assert.equal(items[0].state.winTile, "s8");
});
