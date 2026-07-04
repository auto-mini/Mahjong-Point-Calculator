import test from "node:test";
import assert from "node:assert/strict";

import {
  calculate,
  candidateMeldsFor,
  countDora,
  createMeld,
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
  return calculate(createStateFromMelds({ lastKanWin: false, ...partial }));
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
  assert.equal(validateTiles(["m5", "m5", "m5", "m5"]).length, 1);
});

test("candidate melds include red-five variants when a 5 can appear", () => {
  const candidates = candidateMeldsFor("m3").map((candidate) => `${candidate.kind}:${candidate.tiles.join(",")}`);
  assert.equal(candidates.includes("sequence:m3,m4,m5"), true);
  assert.equal(candidates.includes("sequence:m3,m4,m5r"), true);
});

test("normal five candidates keep the selected physical five", () => {
  const candidates = candidateMeldsFor("m5").map((candidate) => `${candidate.kind}:${candidate.tiles.join(",")}`);
  assert.equal(candidates.includes("sequence:m3,m4,m5"), true);
  assert.equal(candidates.includes("sequence:m3,m4,m5r"), false);
  assert.equal(candidates.includes("sequence:m4,m5,m6"), true);
  assert.equal(candidates.includes("sequence:m4,m5r,m6"), false);
  assert.equal(candidates.includes("quad:m5,m5,m5,m5"), false);
  assert.equal(candidates.includes("quad:m5r,m5,m5,m5"), true);
});

test("sequence meld recognition does not depend on tile order", () => {
  assert.equal(createMeld(["m2", "m1", "m3"]).kind, "sequence");
});

test("pairs cannot be marked open by restored or shared state", () => {
  assert.equal(createMeld(["m1", "m1"], true).open, false);
});

test("winning tile candidates keep red five separate from normal five", () => {
  const candidates = winningTileCandidates([
    { tiles: ["m3", "m4", "m5r"] },
    { tiles: ["m5", "m6", "m7"] },
    { tiles: ["east", "east"] },
  ]);
  assert.deepEqual(candidates, ["m3", "m4", "m5r", "m5", "m6", "m7", "east"]);
});

test("winning tile candidates exclude open fixed melds", () => {
  const candidates = winningTileCandidates([
    { tiles: ["m1", "m2", "m3"], open: true },
    { tiles: ["p5", "p5"] },
  ]);
  assert.deepEqual(candidates, ["p5"]);
});

test("winning tile candidates exclude closed quads", () => {
  const candidates = winningTileCandidates([
    createMeld(["white", "white", "white", "white"]),
    createMeld(["p5", "p5"]),
  ]);
  assert.deepEqual(candidates, ["p5"]);
});

test("chankan winning tile candidates are limited to closed sequences", () => {
  const candidates = winningTileCandidates([
    { tiles: ["m1", "m2", "m3"] },
    { tiles: ["p2", "p2", "p2"] },
    { tiles: ["s3", "s4", "s5"], open: true },
    { tiles: ["east", "east"] },
  ], { chankan: true });
  assert.deepEqual(candidates, ["m1", "m2", "m3"]);
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

test("own kan dora requires a second dora indicator", () => {
  const base = {
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    lastKanWin: false,
    melds: [
      { tiles: ["m1", "m1", "m1", "m1"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["p5", "p6", "p7"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "east",
  };
  const errors = validateState(createStateFromMelds({
    ...base,
    doraIndicators: ["p9"],
  }));
  assert.equal(errors.includes("도라 표시패를 2개 이상 입력해주세요."), true);

  const fixed = validateState(createStateFromMelds({
    ...base,
    doraIndicators: ["p9", "s9"],
  }));
  assert.equal(fixed.includes("도라 표시패를 2개 이상 입력해주세요."), false);
});

test("ron after another player's kan still requires the added dora indicator", () => {
  const errors = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    lastKanWin: true,
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  }));
  assert.equal(errors.includes("도라 표시패를 2개 이상 입력해주세요."), true);
});

test("rinshan requires a hand quad and last kan type", () => {
  const noQuad = validateState(createStateFromMelds({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    situation: { rinshan: true, none: false },
    lastKanWin: true,
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  }));
  assert.equal(noQuad.includes("영상개화는 손패에 깡쯔가 있어야 합니다."), true);

  const missingType = validateState(createStateFromMelds({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    situation: { rinshan: true, none: false },
    lastKanWin: true,
    melds: [
      { tiles: ["m1", "m1", "m1", "m1"], open: false },
      { tiles: ["p1", "p1", "p1", "p1"], open: true },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "east",
    doraIndicators: ["east"],
  }));
  assert.equal(missingType.includes("쯔모 직전 깡 종류를 선택해주세요."), true);
});

test("rinshan added kan dora depends on closed kan answer", () => {
  const closedBase = {
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    situation: { rinshan: true, none: false },
    lastKanWin: true,
    melds: [
      { tiles: ["m1", "m1", "m1", "m1"], open: false },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["p5", "p6", "p7"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "east",
    doraIndicators: ["east"],
  };

  const closedKan = validateState(createStateFromMelds(closedBase));
  assert.equal(closedKan.includes("도라 표시패를 2개 이상 입력해주세요."), true);

  const openKan = validateState(createStateFromMelds({
    ...closedBase,
    melds: [
      { tiles: ["m1", "m1", "m1", "m1"], open: true },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["p5", "p6", "p7"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["east", "east"] },
    ],
  }));
  assert.equal(openKan.includes("도라 표시패를 2개 이상 입력해주세요."), false);
});

test("chankan does not add the robbed kan dora indicator", () => {
  const errors = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { chankan: true, none: false },
    lastKanWin: true,
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  }));
  assert.equal(errors.includes("해당 깡으로 인한 도라가 인정됩니다. 도라 표시패를 2개 이상 입력해주세요."), false);
});

test("inactive ura indicators are ignored by tile quantity validation", () => {
  const errors = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    lastKanWin: false,
    melds: [
      { tiles: ["m1", "m1", "m1", "m1"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["p5", "p6", "p7"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "east",
    doraIndicators: ["p9", "s9"],
    uraIndicators: ["m1"],
  }));
  assert.equal(errors.length, 0);
});

test("chankan requires the winning tile to be in a closed sequence", () => {
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
  assert.equal(errors.includes("창깡 화료패는 슌쯔 구성패 중에서 선택해야 합니다."), true);
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

test("winning tile interpretation chooses the best wait and yaku", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m2", "m3", "m4"] },
      { tiles: ["p3", "p4", "p5"] },
      { tiles: ["p6", "p7", "p8"] },
      { tiles: ["s3", "s4", "s5"] },
      { tiles: ["m2", "m2"] },
    ],
    winTile: "m2",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 2);
  assert.equal(result.fu, 30);
  assert.equal(result.score.display, "2000점");
  assert.equal(result.yaku.some((item) => item.name === "핑후"), true);
});

test("winning tile shared by multiple sequences can still be pinfu", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["m3", "m4", "m5"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["p8", "p8"] },
    ],
    winTile: "m3",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 1);
  assert.equal(result.fu, 30);
  assert.equal(result.score.display, "1000점");
  assert.equal(result.yaku.some((item) => item.name === "핑후"), true);
});

test("ron winning tile in a sequence does not open unrelated closed triplets", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m2", "m2", "m2"] },
      { tiles: ["m2", "m3", "m4"] },
      { tiles: ["p3", "p3", "p3"] },
      { tiles: ["s4", "s4", "s4"] },
      { tiles: ["p5", "p5"] },
    ],
    winTile: "m2",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 3);
  assert.equal(result.fu, 50);
  assert.equal(result.score.display, "6400점");
  assert.equal(result.yaku.some((item) => item.name === "삼암각"), true);
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

test("ron completing one of four closed triplets is not treated as suuankou", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m2", "m2", "m2"] },
      { tiles: ["p3", "p3", "p3"] },
      { tiles: ["s4", "s4", "s4"] },
      { tiles: ["m6", "m6", "m6"] },
      { tiles: ["p5", "p5"] },
    ],
    winTile: "m2",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.yaku.some((item) => item.name === "또이또이"), true);
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

test("four identical closed sequences can score as ryanpeikou", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["m5", "m5"] },
    ],
    winTile: "m5",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 9);
  assert.equal(result.yaku.some((item) => item.han === 3), true);
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

test("red dora is not counted again as ura dora", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, none: false },
    melds: [
      { tiles: ["m3", "m4", "m5r"] },
      { tiles: ["m6", "m7", "m8"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["s4", "s5", "s6"] },
      { tiles: ["p5", "p5"] },
    ],
    winTile: "s6",
    doraIndicators: ["p9"],
    uraIndicators: ["s9"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.yaku.some((item) => item.name === "도라" && item.han === 1), true);
  assert.equal(result.yaku.some((item) => item.name === "우라도라"), false);
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
    winTile: "p6",
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

test("3 han 70 fu is labelled as mangan", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["green", "green", "green"] },
      { tiles: ["m1", "m1", "m1", "m1"] },
      { tiles: ["p9", "p9", "p9"], open: true },
      { tiles: ["s1", "s1", "s1"], open: true },
      { tiles: ["m5", "m5"] },
    ],
    winTile: "m5",
    doraIndicators: ["m2", "p2"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 3);
  assert.equal(result.fu, 70);
  assert.equal(result.score.limitName, "만관");
  assert.equal(result.score.display, "8000점");
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
    honba: 3,
    situation: { riichi: true, ippatsu: true, none: false },
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["p5r", "p6", "p7"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "p5r",
    lastKanWin: false,
    doraIndicators: ["p1", null, "s9"],
    uraIndicators: ["m9", null, "red"],
  });
  const encoded = encodeShareState(state);
  const legacy = payload({
    v: 1,
    winMethod: state.winMethod,
    roundWind: state.roundWind,
    seatWind: state.seatWind,
    honba: state.honba,
    situation: state.situation,
    melds: state.melds.map((meld) => ({ tiles: meld.tiles, open: meld.open })),
    winTile: state.winTile,
    lastKanWin: state.lastKanWin,
    lastKanClosed: state.lastKanClosed,
    doraIndicators: state.doraIndicators,
    uraIndicators: state.uraIndicators,
  });
  assert.equal(encoded.startsWith("2~"), true);
  assert.equal(encoded.length < legacy.length, true);
  const decoded = decodeShareState(encoded);
  assert.equal(decoded.winMethod, "ron");
  assert.equal(decoded.honba, 3);
  assert.equal(decoded.situation.riichi, true);
  assert.equal(decoded.situation.ippatsu, true);
  assert.equal(decoded.melds[0].tiles.join(","), "m1,m2,m3");
  assert.equal(decoded.melds[1].tiles.join(","), "p5r,p6,p7");
  assert.equal(decoded.winTile, "p5r");
  assert.deepEqual(decoded.doraIndicators.slice(0, 3), ["p1", null, "s9"]);
  assert.deepEqual(decoded.uraIndicators.slice(0, 3), ["m9", null, "red"]);
});

test("legacy v1 share state still decodes", () => {
  const decoded = decodeShareState(payload({
    v: 1,
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [{ tiles: ["m1", "m2", "m3"] }],
    winTile: "m3",
    doraIndicators: ["p1"],
  }));
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

test("share state parser rejects oversized payloads", () => {
  assert.equal(decodeShareState(`2~${"A".repeat(5000)}`), null);
});

test("recent item sanitizer keeps only restorable valid calculations", () => {
  const goodState = createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    lastKanWin: false,
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
