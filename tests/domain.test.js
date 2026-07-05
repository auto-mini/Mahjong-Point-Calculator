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

test("non-boolean open values are ignored by restored state", () => {
  const state = createStateFromMelds({
    melds: [{ tiles: ["m1", "m2", "m3"], open: "false" }],
  });
  assert.equal(state.melds[0].open, false);
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
    { tiles: ["p4", "p5", "p6"] },
    { tiles: ["s3", "s4", "s5"], open: true },
    { tiles: ["east", "east"] },
  ], { chankan: true });
  assert.deepEqual(candidates, ["m1", "m2", "m3", "p4", "p5", "p6"]);
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

test("five indicators do not count as definitely normal fives", () => {
  const errors = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    lastKanWin: false,
    melds: [
      { tiles: ["m5", "m5", "m5"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["p5", "p6", "p7"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "east",
    doraIndicators: ["m5"],
  }));
  assert.equal(errors.includes("동일 수패 일반5 4장 이상: 5만이 4장입니다."), false);
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

test("ippatsu is rejected after a non-chankan kan", () => {
  const errors = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, ippatsu: true, none: false },
    lastKanWin: true,
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east", "south"],
    uraIndicators: ["east", "south"],
  }));
  assert.equal(errors.includes("깡 직후 화료에서는 일발을 선택할 수 없습니다."), true);
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

test("rinshan with mixed quads asks for last kan type before requiring the closed-kan dora", () => {
  const mixedQuads = [
    { tiles: ["m1", "m1", "m1", "m1"] },
    { tiles: ["p2", "p2", "p2", "p2"], open: true },
    { tiles: ["s3", "s4", "s5"] },
    { tiles: ["m3", "m4", "m5"] },
    { tiles: ["east", "east"] },
  ];
  const pending = validateState(createStateFromMelds({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    situation: { rinshan: true, none: false },
    melds: mixedQuads,
    winTile: "s5",
    doraIndicators: ["p9", "s9"],
  }));
  assert.equal(pending.includes("쯔모 직전 깡 종류를 선택해주세요."), true);
  assert.equal(pending.includes("도라 표시패를 3개 이상 입력해주세요."), false);

  const closedLastKan = validateState(createStateFromMelds({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    situation: { rinshan: true, none: false },
    melds: mixedQuads,
    winTile: "s5",
    lastKanWin: true,
    lastKanClosed: true,
    doraIndicators: ["p9", "s9"],
  }));
  assert.equal(closedLastKan.includes("도라 표시패를 3개 이상 입력해주세요."), true);

  const openLastKan = validateState(createStateFromMelds({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    situation: { rinshan: true, none: false },
    melds: mixedQuads,
    winTile: "s5",
    lastKanWin: true,
    lastKanClosed: false,
    doraIndicators: ["p9", "s9"],
  }));
  assert.equal(openLastKan.includes("쯔모 직전 깡 종류를 선택해주세요."), false);
  assert.equal(openLastKan.includes("도라 표시패를 3개 이상 입력해주세요."), false);
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

test("chankan can keep ippatsu but not double riichi in non-yakuman scope", () => {
  const ippatsuChankan = calculate(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, ippatsu: true, chankan: true, none: false },
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
    uraIndicators: ["south"],
  }));
  assert.equal(ippatsuChankan.ok, true);
  assert.equal(ippatsuChankan.yaku.some((item) => item.name === "일발"), true);
  assert.equal(ippatsuChankan.yaku.some((item) => item.name === "창깡"), true);

  const doubleRiichiChankan = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { doubleRiichi: true, chankan: true, none: false },
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
    uraIndicators: ["south"],
  }));
  assert.equal(doubleRiichiChankan.includes("창깡과 더블리치는 동시에 선택할 수 없습니다."), true);
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

test("chankan rejects extra visible copies of the robbed tile", () => {
  const extraInHand = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { chankan: true, riichi: true, none: false },
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["m3", "m3", "m3"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "m3",
    doraIndicators: ["east"],
    uraIndicators: ["south"],
  }));
  assert.equal(extraInHand.includes("창깡 화료패와 같은 패가 손패/표시패에 추가로 있으면 안 됩니다."), true);

  const extraIndicator = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { chankan: true, none: false },
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["p5", "p6", "p7"] },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "m3",
    doraIndicators: ["m3"],
  }));
  assert.equal(extraIndicator.includes("창깡 화료패와 같은 패가 손패/표시패에 추가로 있으면 안 됩니다."), true);
});

test("chankan candidates come from automatic decomposition, not input grouping", () => {
  const melds = [
    { tiles: ["m1", "m1", "m1"] },
    { tiles: ["m2", "m2", "m2"] },
    { tiles: ["m3", "m3", "m3"] },
    { tiles: ["p4", "p5", "p6"] },
    { tiles: ["p8", "p8"] },
  ];
  const candidates = winningTileCandidates(melds, { chankan: true });
  assert.deepEqual(candidates, ["m1", "m2", "m3", "p4", "p5", "p6"]);

  const errors = validateState(createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { chankan: true, none: false },
    melds,
    winTile: "m2",
    doraIndicators: ["p9"],
  }));
  assert.equal(errors.includes("창깡 화료패는 슌쯔 구성패 중에서 선택해야 합니다."), false);
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

test("equivalent automatic alternatives are hidden", () => {
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
  assert.equal(result.alternatives.length, 0);
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

test("child pinfu tsumo displays split payment and total", () => {
  const result = calc({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "south",
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 2);
  assert.equal(result.fu, 20);
  assert.equal(result.score.display, "400/700");
  assert.equal(result.score.total, 1500);
});

test("dealer pinfu tsumo displays all payment and total", () => {
  const result = calc({
    winMethod: "tsumo",
    roundWind: "east",
    seatWind: "east",
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["south"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 2);
  assert.equal(result.fu, 20);
  assert.equal(result.score.display, "700 all");
  assert.equal(result.score.total, 2100);
});

test("honba is added to ron payment and total", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    honba: 2,
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 1);
  assert.equal(result.fu, 30);
  assert.equal(result.score.display, "1600점");
  assert.equal(result.score.total, 1600);
});

test("score calculation clamps honba to the supported UI range", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    honba: 42,
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.score.display, "3400점");
  assert.equal(result.score.total, 3400);
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

test("representative pattern yaku are detected", () => {
  const sanshokuDoujun = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["p1", "p2", "p3"] },
      { tiles: ["s1", "s2", "s3"] },
      { tiles: ["m4", "m5", "m6"] },
      { tiles: ["north", "north"] },
    ],
    winTile: "m4",
    doraIndicators: ["east"],
  });
  assert.equal(sanshokuDoujun.ok, true);
  assert.deepEqual(sanshokuDoujun.yaku.find((item) => item.name === "삼색동순"), { name: "삼색동순", han: 2 });

  const sanshokuDoukou = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m2", "m2", "m2"] },
      { tiles: ["p2", "p2", "p2"] },
      { tiles: ["s2", "s2", "s2"] },
      { tiles: ["m3", "m4", "m5"] },
      { tiles: ["north", "north"] },
    ],
    winTile: "m3",
    doraIndicators: ["east"],
  });
  assert.equal(sanshokuDoukou.ok, true);
  assert.deepEqual(sanshokuDoukou.yaku.find((item) => item.name === "삼색동각"), { name: "삼색동각", han: 2 });

  const ittsu = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["m4", "m5", "m6"] },
      { tiles: ["m7", "m8", "m9"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["north", "north"] },
    ],
    winTile: "m7",
    doraIndicators: ["east"],
  });
  assert.equal(ittsu.ok, true);
  assert.deepEqual(ittsu.yaku.find((item) => item.name === "일기통관"), { name: "일기통관", han: 2 });

  const chanta = calc({
    winMethod: "ron",
    roundWind: "south",
    seatWind: "west",
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["p7", "p8", "p9"] },
      { tiles: ["s1", "s1", "s1"] },
      { tiles: ["m9", "m9", "m9"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "m3",
    doraIndicators: ["p2"],
  });
  assert.equal(chanta.ok, true);
  assert.deepEqual(chanta.yaku.find((item) => item.name === "찬타"), { name: "찬타", han: 2 });

  const junchan = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["m7", "m8", "m9"] },
      { tiles: ["p1", "p2", "p3"] },
      { tiles: ["p7", "p8", "p9"] },
      { tiles: ["s9", "s9"] },
    ],
    winTile: "m3",
    doraIndicators: ["east"],
  });
  assert.equal(junchan.ok, true);
  assert.deepEqual(junchan.yaku.find((item) => item.name === "준찬타"), { name: "준찬타", han: 3 });
  assert.equal(junchan.yaku.some((item) => item.name === "찬타"), false);
});

test("shousangen is detected without treating it as daisangen", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["white", "white", "white"] },
      { tiles: ["green", "green", "green"] },
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["p7", "p8", "p9"] },
      { tiles: ["red", "red"] },
    ],
    winTile: "red",
    doraIndicators: ["m4"],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.yaku.find((item) => item.name === "소삼원"), { name: "소삼원", han: 2 });
  assert.deepEqual(result.yaku.find((item) => item.name === "백"), { name: "백", han: 1 });
  assert.deepEqual(result.yaku.find((item) => item.name === "발"), { name: "발", han: 1 });
});

test("open ron with no added fu keeps minimum 30 fu breakdown consistent", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m2", "m3", "m4"], open: true },
      { tiles: ["m3", "m4", "m5"], open: true },
      { tiles: ["p2", "p3", "p4"], open: true },
      { tiles: ["s2", "s3", "s4"] },
      { tiles: ["p6", "p6"] },
    ],
    winTile: "s2",
    doraIndicators: ["m1"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.fu, 30);
  assert.equal(result.rawFu, 30);
  assert.deepEqual(result.fuLines, [
    { name: "기본부", fu: 20 },
    { name: "부가 부수 없음 최소", fu: 10 },
  ]);
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

test("open hand with no yaku and no dora reports missing yaku", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m2", "m3"], open: true },
      { tiles: ["p1", "p2", "p3"], open: true },
      { tiles: ["s4", "s5", "s6"], open: true },
      { tiles: ["m7", "m8", "m9"], open: true },
      { tiles: ["p8", "p8"] },
    ],
    winTile: "p8",
    doraIndicators: ["east"],
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ["일반 역이 없습니다."]);
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

test("4 han 40 fu is labelled as mangan", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    situation: { riichi: true, ippatsu: true, none: false },
    melds: [
      { tiles: ["white", "white", "white"] },
      { tiles: ["m2", "m3", "m4"] },
      { tiles: ["p2", "p3", "p4"] },
      { tiles: ["s6", "s7", "s8"] },
      { tiles: ["m5", "m5"] },
    ],
    winTile: "s8",
    doraIndicators: ["m1"],
    uraIndicators: ["east"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.han, 4);
  assert.equal(result.fu, 40);
  assert.equal(result.score.limitName, "만관");
  assert.equal(result.score.display, "8000점");
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

test("explicit yakuman patterns are detected and not scored", () => {
  const cases = [
    {
      name: "대삼원",
      melds: [
        { tiles: ["white", "white", "white"] },
        { tiles: ["green", "green", "green"] },
        { tiles: ["red", "red", "red"] },
        { tiles: ["m2", "m3", "m4"] },
        { tiles: ["p5", "p5"] },
      ],
      winTile: "p5",
    },
    {
      name: "자일색",
      melds: [
        { tiles: ["east", "east", "east"] },
        { tiles: ["south", "south", "south"] },
        { tiles: ["west", "west", "west"] },
        { tiles: ["white", "white", "white"] },
        { tiles: ["red", "red"] },
      ],
      winTile: "red",
    },
    {
      name: "녹일색",
      melds: [
        { tiles: ["s2", "s3", "s4"] },
        { tiles: ["s2", "s3", "s4"] },
        { tiles: ["s6", "s6", "s6"] },
        { tiles: ["s8", "s8", "s8"] },
        { tiles: ["green", "green"] },
      ],
      winTile: "green",
    },
    {
      name: "청노두",
      melds: [
        { tiles: ["m1", "m1", "m1"] },
        { tiles: ["m9", "m9", "m9"] },
        { tiles: ["p1", "p1", "p1"] },
        { tiles: ["p9", "p9", "p9"] },
        { tiles: ["s1", "s1"] },
      ],
      winTile: "s1",
    },
    {
      name: "소사희",
      melds: [
        { tiles: ["east", "east", "east"] },
        { tiles: ["south", "south", "south"] },
        { tiles: ["west", "west", "west"] },
        { tiles: ["m2", "m3", "m4"] },
        { tiles: ["north", "north"] },
      ],
      winTile: "north",
    },
    {
      name: "대사희",
      melds: [
        { tiles: ["east", "east", "east"] },
        { tiles: ["south", "south", "south"] },
        { tiles: ["west", "west", "west"] },
        { tiles: ["north", "north", "north"] },
        { tiles: ["m2", "m2"] },
      ],
      winTile: "m2",
    },
    {
      name: "사암각",
      melds: [
        { tiles: ["m2", "m2", "m2"] },
        { tiles: ["m6", "m6", "m6"] },
        { tiles: ["p3", "p3", "p3"] },
        { tiles: ["s4", "s4", "s4"] },
        { tiles: ["p8", "p8"] },
      ],
      winTile: "p8",
    },
  ];

  for (const item of cases) {
    const result = calc({
      winMethod: "ron",
      roundWind: "east",
      seatWind: "south",
      melds: item.melds,
      winTile: item.winTile,
      doraIndicators: ["m1"],
    });
    assert.equal(result.ok, false, item.name);
    assert.equal(result.errors[0].includes(item.name), true, item.name);
  }
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

test("four quads are detected as yakuman and not scored", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m2", "m2", "m2", "m2"], open: true },
      { tiles: ["p3", "p3", "p3", "p3"], open: true },
      { tiles: ["s4", "s4", "s4", "s4"] },
      { tiles: ["white", "white", "white", "white"] },
      { tiles: ["east", "east"] },
    ],
    winTile: "east",
    doraIndicators: ["m1", "m9", "p1", "p9", "s1"],
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].includes("사깡쯔"), true);
});

test("overlapping yakuman names are all reported", () => {
  const result = calc({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["east", "east", "east"] },
      { tiles: ["south", "south", "south"] },
      { tiles: ["west", "west", "west"] },
      { tiles: ["north", "north", "north"] },
      { tiles: ["red", "red"] },
    ],
    winTile: "red",
    doraIndicators: ["m1"],
  });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].includes("대사희"), true);
  assert.equal(result.errors[0].includes("자일색"), true);
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
    riichiSticks: 4,
    situation: { riichi: "yes", none: false },
    melds: [
      { tiles: ["m1", "m1", "m1", "m1", "m1"], open: true },
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

test("share state parser clamps honba to the supported UI range", () => {
  const decoded = decodeShareState(payload({
    v: 1,
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    honba: 42,
    melds: [{ tiles: ["m1", "m2", "m3"] }],
    winTile: "m3",
    doraIndicators: ["p1"],
  }));
  assert.equal(decoded.honba, 8);
});

test("share state parser rejects oversized meld lists instead of truncating them", () => {
  const decoded = decodeShareState(payload({
    v: 1,
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [
      { tiles: ["m1", "m2", "m3"] },
      { tiles: ["m4", "m5", "m6"] },
      { tiles: ["p1", "p2", "p3"] },
      { tiles: ["p4", "p5", "p6"] },
      { tiles: ["s1", "s1"] },
      { tiles: ["s2", "s2"] },
      { tiles: ["s3", "s3"] },
      { tiles: ["s4", "s4"] },
    ],
    winTile: "s1",
    doraIndicators: ["east"],
  }));
  assert.deepEqual(decoded.melds, []);
});

test("share state parser rejects oversized indicator lists instead of truncating them", () => {
  const decoded = decodeShareState(payload({
    v: 1,
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    melds: [{ tiles: ["m1", "m2", "m3"] }],
    winTile: "m3",
    doraIndicators: ["m1", "m2", "m3", "m4", "m5", "m6"],
    uraIndicators: ["p1", "p2", "p3", "p4", "p5", "p6"],
  }));
  assert.deepEqual(decoded.doraIndicators, [null, null, null, null, null]);
  assert.deepEqual(decoded.uraIndicators, [null, null, null, null, null]);
});

test("share state parser rejects oversized payloads", () => {
  assert.equal(decodeShareState(`2~${"A".repeat(5000)}`), null);
});

test("compact share state parser rejects malformed payloads", () => {
  assert.equal(decodeShareState("2~0000"), null);
  assert.equal(decodeShareState("2~0000~~~~~~extra"), null);
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

test("recent item sanitizer filters invalid entries before limiting to 20", () => {
  const goodState = createStateFromMelds({
    winMethod: "ron",
    roundWind: "east",
    seatWind: "south",
    lastKanWin: false,
    melds: pinfuRonMelds,
    winTile: "s8",
    doraIndicators: ["east"],
  });
  const invalid = Array.from({ length: 25 }, (_, index) => ({ label: `bad-${index}`, state: { winMethod: "ron" } }));
  const items = sanitizeRecentItems([
    ...invalid,
    { label: "ok", at: "2026-07-04T00:00:00.000Z", state: goodState },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].label, "ok");
});
