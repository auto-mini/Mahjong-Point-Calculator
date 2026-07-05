export const SUITS = ["m", "p", "s"];
export const WINDS = ["east", "south", "west", "north"];
export const DRAGONS = ["white", "green", "red"];
export const HONORS = [...WINDS, ...DRAGONS];
export const RED_FIVES = new Map([
  ["m5r", "m5"],
  ["p5r", "p5"],
  ["s5r", "s5"],
]);

const WIND_LABELS = {
  east: "동",
  south: "남",
  west: "서",
  north: "북",
};

const DRAGON_LABELS = {
  white: "백",
  green: "발",
  red: "중",
};

const TILE_LABELS = {
  ...WIND_LABELS,
  ...DRAGON_LABELS,
};

const ROUND_UP = (value, unit = 100) => Math.ceil(value / unit) * unit;

export const ALL_TILES_37 = [
  ...SUITS.flatMap((suit) => Array.from({ length: 9 }, (_, index) => `${suit}${index + 1}`)),
  "m5r",
  "p5r",
  "s5r",
  ...HONORS,
];

export const ALL_INDICATORS_34 = [
  ...SUITS.flatMap((suit) => Array.from({ length: 9 }, (_, index) => `${suit}${index + 1}`)),
  ...HONORS,
];

const SHARE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const SHARE_VERSION_PREFIX = "2~";
const SHARE_NULL = ".";
const SHARE_FIELD_SEPARATOR = "~";
const SHARE_MELD_SEPARATOR = ".";
const MAX_SHARE_STATE_LENGTH = 4096;
const MAX_HONBA = 8;

export function normalizeTile(tile) {
  return RED_FIVES.get(tile) || tile;
}

export function tileLabel(tile) {
  if (tile.endsWith("5r")) return `적5${suitLabel(tile[0])}`;
  if (TILE_LABELS[tile]) return TILE_LABELS[tile];
  const parsed = parseSuit(tile);
  if (parsed) return `${parsed.number}${suitLabel(parsed.suit)}`;
  return tile;
}

function suitLabel(suit) {
  return { m: "만", p: "통", s: "삭" }[suit] || suit;
}

function parseSuit(tile) {
  const normalized = normalizeTile(tile);
  const match = /^([mps])([1-9])$/.exec(normalized);
  if (!match) return null;
  return { suit: match[1], number: Number(match[2]) };
}

function tileSortKey(tile) {
  const normalized = normalizeTile(tile);
  const parsed = parseSuit(normalized);
  if (parsed) return `${SUITS.indexOf(parsed.suit)}${parsed.number}`;
  return `4${HONORS.indexOf(normalized)}`;
}

export function sortTiles(tiles) {
  return [...tiles].sort((a, b) => tileSortKey(a).localeCompare(tileSortKey(b)));
}

export function countTiles(tiles, { normalize = true } = {}) {
  const counts = new Map();
  for (const tile of tiles) {
    const key = normalize ? normalizeTile(tile) : tile;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

export function validateTiles(tiles) {
  const errors = [];
  const normalizedCounts = countTiles(tiles);
  for (const [tile, count] of normalizedCounts) {
    if (count > 4) errors.push(`동일패 5장 이상: ${tileLabel(tile)}이 ${count}장입니다.`);
  }
  for (const red of RED_FIVES.keys()) {
    const count = tiles.filter((tile) => tile === red).length;
    if (count > 1) errors.push(`동일 수패 적5 2장 이상: ${tileLabel(red)}이 ${count}장입니다.`);
  }
  for (const normal of RED_FIVES.values()) {
    const count = tiles.filter((tile) => tile === normal).length;
    if (count > 3) errors.push(`동일 수패 일반5 4장 이상: ${tileLabel(normal)}이 ${count}장입니다.`);
  }
  return errors;
}

export function validateVisibleTiles(tiles) {
  const errors = [];
  const normalizedCounts = countTiles(tiles);
  for (const [tile, count] of normalizedCounts) {
    if (count > 4) errors.push(`동일패 5장 이상: ${tileLabel(tile)}이 ${count}장입니다.`);
  }
  return errors;
}

export function nextDora(indicator) {
  const tile = normalizeTile(indicator);
  const parsed = parseSuit(tile);
  if (parsed) {
    return `${parsed.suit}${parsed.number === 9 ? 1 : parsed.number + 1}`;
  }
  if (WINDS.includes(tile)) return WINDS[(WINDS.indexOf(tile) + 1) % WINDS.length];
  if (DRAGONS.includes(tile)) return DRAGONS[(DRAGONS.indexOf(tile) + 1) % DRAGONS.length];
  throw new Error(`Unknown dora indicator: ${indicator}`);
}

export function countDora(tiles, indicators = [], { includeRed = true } = {}) {
  const normalizedTiles = tiles.map(normalizeTile);
  const doraTiles = indicators.filter(Boolean).map(nextDora);
  let count = 0;
  for (const dora of doraTiles) {
    count += normalizedTiles.filter((tile) => tile === dora).length;
  }
  if (includeRed) count += tiles.filter((tile) => RED_FIVES.has(tile)).length;
  return count;
}

function meldKind(tiles) {
  const normalized = tiles.map(normalizeTile);
  if (normalized.length === 2 && normalized[0] === normalized[1]) return "pair";
  if (normalized.length === 3 && normalized.every((tile) => tile === normalized[0])) return "triplet";
  if (normalized.length === 4 && normalized.every((tile) => tile === normalized[0])) return "quad";
  if (normalized.length === 3) {
    const parsed = normalized.map(parseSuit);
    if (parsed.every(Boolean) && parsed.every((item) => item.suit === parsed[0].suit)) {
      const numbers = parsed.map((item) => item.number).sort((a, b) => a - b);
      if (numbers.join(",") === [numbers[0], numbers[0] + 1, numbers[0] + 2].join(",")) {
        return "sequence";
      }
    }
  }
  return "unknown";
}

export function createMeld(tiles, open = false) {
  const kind = meldKind(tiles);
  return {
    tiles: [...tiles],
    normalizedTiles: tiles.map(normalizeTile),
    kind,
    open: kind !== "pair" && open === true,
  };
}

export function flattenMelds(melds) {
  return melds.flatMap((meld) => meld.tiles);
}

function uniqueTiles(tiles) {
  return [...new Set(tiles.map(normalizeTile))].sort((a, b) => tileSortKey(a).localeCompare(tileSortKey(b)));
}

function uniquePhysicalTiles(tiles) {
  const seen = new Set();
  const result = [];
  for (const tile of tiles) {
    if (seen.has(tile)) continue;
    seen.add(tile);
    result.push(tile);
  }
  return result;
}

function removeTiles(counts, tiles) {
  const next = new Map(counts);
  for (const tile of tiles.map(normalizeTile)) {
    const count = next.get(tile) || 0;
    if (count <= 0) return null;
    if (count === 1) next.delete(tile);
    else next.set(tile, count - 1);
  }
  return next;
}

function countsSize(counts) {
  let size = 0;
  for (const count of counts.values()) size += count;
  return size;
}

function firstTile(counts) {
  return [...counts.keys()].sort((a, b) => tileSortKey(a).localeCompare(tileSortKey(b)))[0];
}

function findMeldCombinations(counts, targetCount) {
  if (targetCount === 0) return countsSize(counts) === 0 ? [[]] : [];
  if (countsSize(counts) !== targetCount * 3) return [];
  const tile = firstTile(counts);
  if (!tile) return [];
  const options = [];
  if ((counts.get(tile) || 0) >= 3) options.push({ kind: "triplet", tiles: [tile, tile, tile], open: false });
  const parsed = parseSuit(tile);
  if (parsed && parsed.number <= 7) {
    const seq = [tile, `${parsed.suit}${parsed.number + 1}`, `${parsed.suit}${parsed.number + 2}`];
    if (seq.every((item) => (counts.get(item) || 0) > 0)) options.push({ kind: "sequence", tiles: seq, open: false });
  }
  const results = [];
  for (const option of options) {
    const next = removeTiles(counts, option.tiles);
    if (!next) continue;
    for (const rest of findMeldCombinations(next, targetCount - 1)) {
      results.push([option, ...rest]);
    }
  }
  return results;
}

function findStandardHands(closedTiles, fixedMelds) {
  const neededMelds = 4 - fixedMelds.length;
  if (neededMelds < 0) return [];
  const counts = countTiles(closedTiles);
  const hands = [];
  for (const pairTile of uniqueTiles(closedTiles)) {
    if ((counts.get(pairTile) || 0) < 2) continue;
    const withoutPair = removeTiles(counts, [pairTile, pairTile]);
    if (!withoutPair) continue;
    for (const melds of findMeldCombinations(withoutPair, neededMelds)) {
      hands.push({
        type: "standard",
        pair: { kind: "pair", tiles: [pairTile, pairTile], open: false },
        melds: [...fixedMelds, ...melds],
      });
    }
  }
  return hands;
}

function findChiitoi(tiles, fixedMelds) {
  if (fixedMelds.length > 0 || tiles.length !== 14) return [];
  const counts = countTiles(tiles);
  if (counts.size !== 7) return [];
  if ([...counts.values()].every((count) => count === 2)) {
    return [{ type: "chiitoi", pairs: [...counts.keys()].map((tile) => [tile, tile]) }];
  }
  return [];
}

function splitFixedAndClosed(inputMelds) {
  const fixedMelds = [];
  const closedTiles = [];
  for (const raw of inputMelds) {
    const meld = createMeld(raw.tiles, raw.open);
    if (meld.kind === "unknown") continue;
    if (meld.open || meld.kind === "quad") fixedMelds.push(meld);
    else closedTiles.push(...meld.tiles);
  }
  return { fixedMelds, closedTiles };
}

export function decomposeHand(inputMelds) {
  const { fixedMelds, closedTiles } = splitFixedAndClosed(inputMelds);
  return [...findChiitoi(closedTiles, fixedMelds), ...findStandardHands(closedTiles, fixedMelds)];
}

function isHonor(tile) {
  return HONORS.includes(normalizeTile(tile));
}

function isTerminal(tile) {
  const parsed = parseSuit(tile);
  return parsed ? parsed.number === 1 || parsed.number === 9 : false;
}

function isYaochu(tile) {
  return isHonor(tile) || isTerminal(tile);
}

function isGreen(tile) {
  return ["s2", "s3", "s4", "s6", "s8", "green"].includes(normalizeTile(tile));
}

function handTilesFromShape(shape) {
  if (shape.type === "chiitoi") return shape.pairs.flat();
  return [...shape.pair.tiles, ...shape.melds.flatMap((meld) => meld.normalizedTiles || meld.tiles)];
}

function isClosed(shape) {
  return shape.type === "chiitoi" || shape.melds.every((meld) => !meld.open);
}

function isChurenPoutou(shape) {
  if (!isClosed(shape)) return false;
  const tiles = handTilesFromShape(shape).map(normalizeTile);
  if (tiles.length !== 14) return false;
  const parsed = tiles.map(parseSuit);
  if (!parsed.every(Boolean)) return false;
  const suit = parsed[0].suit;
  if (!parsed.every((item) => item.suit === suit)) return false;
  const counts = new Map();
  for (const item of parsed) counts.set(item.number, (counts.get(item.number) || 0) + 1);
  return (
    (counts.get(1) || 0) >= 3 &&
    (counts.get(9) || 0) >= 3 &&
    [2, 3, 4, 5, 6, 7, 8].every((number) => (counts.get(number) || 0) >= 1)
  );
}

function valuePairFu(pairTile, roundWind, seatWind) {
  const tile = normalizeTile(pairTile);
  let fu = 0;
  if (DRAGONS.includes(tile)) fu += 2;
  if (tile === roundWind) fu += 2;
  if (tile === seatWind) fu += 2;
  return fu;
}

function sequenceWaitFu(meld, winTile) {
  const tile = normalizeTile(winTile);
  const normalizedTiles = meld.tiles.map(normalizeTile);
  if (!normalizedTiles.includes(tile)) return null;
  const numbers = normalizedTiles.map((item) => parseSuit(item)?.number).sort((a, b) => a - b);
  const parsed = parseSuit(tile);
  if (!parsed || numbers.some((number) => !number)) return null;
  if (parsed.number === numbers[1]) return { fu: 2, wait: "간짱" };
  if (numbers[0] === 1 && parsed.number === 3) return { fu: 2, wait: "변짱" };
  if (numbers[2] === 9 && parsed.number === 7) return { fu: 2, wait: "변짱" };
  return { fu: 0, wait: "양면" };
}

function winningContexts(shape, state) {
  if (shape.type !== "standard" || !state.winTile) return [{ wait: { fu: 0, wait: "unknown" }, ronCompletedMeld: null, key: "unknown" }];
  const tile = normalizeTile(state.winTile);
  const contexts = [];
  if (!state.situation?.chankan && shape.pair.tiles.map(normalizeTile).includes(tile)) {
    contexts.push({ wait: { fu: 2, wait: "단기" }, ronCompletedMeld: null, key: "pair" });
  }
  shape.melds.forEach((meld, index) => {
    if (meld.open) return;
    const normalizedTiles = meld.tiles.map(normalizeTile);
    if (!normalizedTiles.includes(tile)) return;
    if (meld.kind === "sequence") {
      const wait = sequenceWaitFu(meld, state.winTile);
      if (wait) contexts.push({ wait, ronCompletedMeld: null, key: `sequence:${index}:${wait.wait}:${wait.fu}` });
    } else if (!state.situation?.chankan && meld.kind === "triplet") {
      contexts.push({
        wait: { fu: 0, wait: "샤보" },
        ronCompletedMeld: state.winMethod === "ron" ? meld : null,
        key: `triplet:${index}`,
      });
    }
  });
  if (state.situation?.chankan) return contexts;
  return contexts.length ? contexts : [{ wait: { fu: 0, wait: "unknown" }, ronCompletedMeld: null, key: "unknown" }];
}

function waitFu(shape, state, context = null) {
  if (shape.type !== "standard" || !state.winTile) return { fu: 0, wait: "unknown" };
  if (context) return context.wait;
  const best = winningContexts(shape, state).sort((a, b) => a.wait.fu - b.wait.fu)[0];
  return best?.wait || { fu: 0, wait: "unknown" };
}

function isRonCompletedMeld(meld, state, context = null) {
  if (state.winMethod !== "ron") return false;
  if (context) return context.ronCompletedMeld === meld;
  return meld.kind === "triplet" && meld.tiles.map(normalizeTile).includes(normalizeTile(state.winTile || ""));
}

function meldFu(meld, state, context = null) {
  if (!["triplet", "quad"].includes(meld.kind)) return 0;
  const tile = normalizeTile(meld.tiles[0]);
  const terminalOrHonor = isYaochu(tile);
  let open = meld.open;
  if (!open && isRonCompletedMeld(meld, state, context)) {
    open = true;
  }
  if (meld.kind === "triplet") {
    if (terminalOrHonor) return open ? 4 : 8;
    return open ? 2 : 4;
  }
  if (terminalOrHonor) return open ? 16 : 32;
  return open ? 8 : 16;
}

function isConcealedTripletForYaku(meld, state, context = null) {
  if (!["triplet", "quad"].includes(meld.kind) || meld.open) return false;
  if (meld.kind === "triplet" && isRonCompletedMeld(meld, state, context)) return false;
  return true;
}

function sequenceKey(meld) {
  const parsed = meld.tiles.map(parseSuit).filter(Boolean).sort((a, b) => a.number - b.number);
  if (parsed.length !== 3) return "";
  return `${parsed[0].suit}${parsed[0].number}`;
}

function hasSameSequenceSet(shape, requiredCopies) {
  if (shape.type !== "standard") return false;
  const counts = new Map();
  for (const meld of shape.melds.filter((item) => item.kind === "sequence" && !item.open)) {
    const key = sequenceKey(meld);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.values()].reduce((pairs, count) => pairs + Math.floor(count / 2), 0) >= requiredCopies;
}

function detectYakuman(shape, state, context = null) {
  const tiles = handTilesFromShape(shape);
  if (tiles.every(isHonor)) return "자일색";
  if (tiles.every(isGreen)) return "녹일색";
  if (tiles.every(isTerminal)) return "청노두";
  if (isChurenPoutou(shape)) return "구련보등";
  if (shape.type === "standard") {
    const triplets = shape.melds.filter((meld) => ["triplet", "quad"].includes(meld.kind));
    const tripletTiles = triplets.map((meld) => normalizeTile(meld.tiles[0]));
    if (DRAGONS.every((dragon) => tripletTiles.includes(dragon))) return "대삼원";
    if (WINDS.every((wind) => tripletTiles.includes(wind))) return "대사희";
    if (tripletTiles.filter((tile) => WINDS.includes(tile)).length === 3 && WINDS.includes(normalizeTile(shape.pair.tiles[0]))) {
      return "소사희";
    }
    if (shape.melds.filter((meld) => meld.kind === "quad").length === 4) return "사깡쯔";
    if (triplets.length === 4 && triplets.every((meld) => isConcealedTripletForYaku(meld, state, context))) return "사암각";
  }
  return null;
}

function detectYaku(shape, state, context = null) {
  const yaku = [];
  const closed = isClosed(shape);
  if (state.situation?.doubleRiichi && closed) yaku.push({ name: "더블리치", han: 2 });
  else if (state.situation?.riichi && closed) yaku.push({ name: "리치", han: 1 });
  if (state.situation?.ippatsu && (state.situation?.riichi || state.situation?.doubleRiichi) && closed) yaku.push({ name: "일발", han: 1 });
  if (state.winMethod === "tsumo" && closed) yaku.push({ name: "멘젠쯔모", han: 1 });
  if (state.situation?.rinshan) yaku.push({ name: "영상개화", han: 1 });
  if (state.situation?.chankan) yaku.push({ name: "창깡", han: 1 });
  if (state.situation?.haitei) yaku.push({ name: "해저로월", han: 1 });
  if (state.situation?.houtei) yaku.push({ name: "하저로어", han: 1 });

  const tiles = handTilesFromShape(shape);
  const allSimple = tiles.every((tile) => {
    const parsed = parseSuit(tile);
    return parsed && parsed.number >= 2 && parsed.number <= 8;
  });
  if (allSimple) yaku.push({ name: "탕야오", han: 1 });

  if (shape.type === "chiitoi") yaku.push({ name: "치또이", han: 2 });
  if (shape.type === "chiitoi" && tiles.every(isYaochu)) yaku.push({ name: "혼노두", han: 2 });

  if (shape.type === "standard") {
    const sequenceMelds = shape.melds.filter((meld) => meld.kind === "sequence");
    const triplets = shape.melds.filter((meld) => ["triplet", "quad"].includes(meld.kind));
    const pairTile = normalizeTile(shape.pair.tiles[0]);
    const wait = waitFu(shape, state, context);
    if (
      closed &&
      sequenceMelds.length === 4 &&
      valuePairFu(pairTile, state.roundWind, state.seatWind) === 0 &&
      wait.fu === 0
    ) {
      yaku.push({ name: "핑후", han: 1 });
    }
    if (closed && hasSameSequenceSet(shape, 2)) yaku.push({ name: "량페코", han: 3 });
    else if (closed && hasSameSequenceSet(shape, 1)) yaku.push({ name: "이페코", han: 1 });

    for (const triplet of triplets) {
      const tile = normalizeTile(triplet.tiles[0]);
      if (DRAGONS.includes(tile)) yaku.push({ name: DRAGON_LABELS[tile], han: 1 });
      if (tile === state.roundWind && tile === state.seatWind) yaku.push({ name: `더블${WIND_LABELS[tile]}`, han: 2 });
      else if (tile === state.roundWind || tile === state.seatWind) yaku.push({ name: WIND_LABELS[tile], han: 1 });
    }
    if (triplets.length === 4) yaku.push({ name: "또이또이", han: 2 });
    if (triplets.filter((meld) => isConcealedTripletForYaku(meld, state, context)).length >= 3) yaku.push({ name: "삼암각", han: 2 });
    if (shape.melds.filter((meld) => meld.kind === "quad").length >= 3) yaku.push({ name: "삼깡쯔", han: 2 });
    if (DRAGONS.filter((dragon) => triplets.some((meld) => normalizeTile(meld.tiles[0]) === dragon)).length === 2 && DRAGONS.includes(pairTile)) {
      yaku.push({ name: "소삼원", han: 2 });
    }
    if (tiles.every(isYaochu) && triplets.length === 4) yaku.push({ name: "혼노두", han: 2 });

    for (const start of [1, 2, 3, 4, 5, 6, 7]) {
      const suited = SUITS.filter((suit) => sequenceMelds.some((meld) => sequenceKey(meld) === `${suit}${start}`));
      if (suited.length === 3) {
        yaku.push({ name: "삼색동순", han: closed ? 2 : 1 });
        break;
      }
    }
    for (const number of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const suited = SUITS.filter((suit) => triplets.some((meld) => normalizeTile(meld.tiles[0]) === `${suit}${number}`));
      if (suited.length === 3) {
        yaku.push({ name: "삼색동각", han: 2 });
        break;
      }
    }
    for (const suit of SUITS) {
      const keys = new Set(sequenceMelds.map(sequenceKey));
      if ([`${suit}1`, `${suit}4`, `${suit}7`].every((key) => keys.has(key))) {
        yaku.push({ name: "일기통관", han: closed ? 2 : 1 });
        break;
      }
    }

    const eachMeldHasYaochu = [...shape.melds, shape.pair].every((item) => item.tiles.some(isYaochu));
    if (eachMeldHasYaochu && sequenceMelds.length > 0) yaku.push({ name: "찬타", han: closed ? 2 : 1 });
    if (eachMeldHasYaochu && sequenceMelds.length > 0 && tiles.every((tile) => !isHonor(tile))) yaku.push({ name: "준찬타", han: closed ? 3 : 2 });
  }

  const suits = new Set(tiles.map(parseSuit).filter(Boolean).map((item) => item.suit));
  const hasHonors = tiles.some(isHonor);
  if (suits.size === 1 && hasHonors) yaku.push({ name: "혼일색", han: closed ? 3 : 2 });
  if (suits.size === 1 && !hasHonors) yaku.push({ name: "청일색", han: closed ? 6 : 5 });

  return dedupeYaku(yaku);
}

function dedupeYaku(yaku) {
  const best = new Map();
  for (const item of yaku) {
    const current = best.get(item.name);
    if (!current || current.han < item.han) best.set(item.name, item);
  }
  if (best.has("량페코")) best.delete("이페코");
  if (best.has("준찬타")) best.delete("찬타");
  return [...best.values()];
}

function calculateFu(shape, state, context = null) {
  if (shape.type === "chiitoi") {
    return {
      fu: 25,
      rawFu: 25,
      lines: [{ name: "치또이", fu: 25 }],
      wait: "단기",
    };
  }
  const closed = isClosed(shape);
  const wait = waitFu(shape, state, context);
  const pairFu = valuePairFu(shape.pair.tiles[0], state.roundWind, state.seatWind);
  const meldLines = shape.melds
    .map((meld) => ({ name: `${tileLabel(meld.tiles[0])} ${meld.kind === "quad" ? "깡쯔" : "커쯔"}`, fu: meldFu(meld, state, context) }))
    .filter((line) => line.fu > 0);
  let rawFu = 20;
  const lines = [{ name: "기본부", fu: 20 }];
  if (closed && state.winMethod === "ron") {
    rawFu += 10;
    lines.push({ name: "멘젠 론", fu: 10 });
  }
  if (state.winMethod === "tsumo") {
    rawFu += 2;
    lines.push({ name: "쯔모부", fu: 2 });
  }
  if (wait.fu) {
    rawFu += wait.fu;
    lines.push({ name: `${wait.wait} 대기`, fu: wait.fu });
  }
  if (pairFu) {
    rawFu += pairFu;
    lines.push({ name: `${tileLabel(shape.pair.tiles[0])} 머리`, fu: pairFu });
  }
  for (const line of meldLines) {
    rawFu += line.fu;
    lines.push(line);
  }

  const pinfu = shape.melds.every((meld) => meld.kind === "sequence") && pairFu === 0 && wait.fu === 0;
  if (pinfu && state.winMethod === "tsumo" && closed) {
    return { fu: 20, rawFu: 20, lines: [{ name: "핑후쯔모", fu: 20 }], wait: wait.wait };
  }
  if (pinfu && state.winMethod === "ron" && closed) {
    return { fu: 30, rawFu: 30, lines: [{ name: "핑후론", fu: 30 }], wait: wait.wait };
  }
  let fu = Math.ceil(rawFu / 10) * 10;
  if (!closed && state.winMethod === "ron" && rawFu === 20) {
    fu = 30;
    lines.push({ name: "부가 부수 없음 최소", fu: 10 });
  }
  return { fu, rawFu, lines, wait: wait.wait };
}

function limitInfo(han, fu) {
  if (han >= 13) return { name: "카조에역만", base: 8000 };
  if (han >= 11) return { name: "삼배만", base: 6000 };
  if (han >= 8) return { name: "배만", base: 4000 };
  if (han >= 6) return { name: "하네만", base: 3000 };
  if (han >= 5) return { name: "만관", base: 2000 };
  const base = fu * 2 ** (han + 2);
  if (base >= 2000) return { name: "만관", base: 2000 };
  return { name: null, base };
}

function calculateScore({ han, fu, seatWind, winMethod, honba = 0, riichiSticks = 0 }) {
  const dealer = seatWind === "east";
  const limit = limitInfo(han, fu);
  const base = limit.base;
  const honbaCount = safeHonba(honba);
  const honbaRon = honbaCount * 300;
  const honbaTsumo = honbaCount * 100;
  const sticks = riichiSticks * 1000;
  if (winMethod === "ron") {
    const payment = ROUND_UP(base * (dealer ? 6 : 4)) + honbaRon;
    return {
      dealer,
      limitName: limit.name,
      total: payment + sticks,
      payments: [{ label: "방총자", amount: payment }],
      display: `${payment + sticks}점`,
    };
  }
  if (dealer) {
    const each = ROUND_UP(base * 2) + honbaTsumo;
    return {
      dealer,
      limitName: limit.name,
      total: each * 3 + sticks,
      payments: [{ label: "각자", amount: each }],
      display: `${each} all`,
    };
  }
  const child = ROUND_UP(base) + honbaTsumo;
  const parent = ROUND_UP(base * 2) + honbaTsumo;
  return {
    dealer,
    limitName: limit.name,
    total: child * 2 + parent + sticks,
    payments: [
      { label: "자", amount: child },
      { label: "오야", amount: parent },
    ],
    display: `${child}/${parent}`,
  };
}

function compareResults(a, b) {
  if (a.score.total !== b.score.total) return b.score.total - a.score.total;
  if (a.han !== b.han) return b.han - a.han;
  if (a.fu !== b.fu) return b.fu - a.fu;
  return a.key.localeCompare(b.key);
}

function resultKey(shape) {
  if (shape.type === "chiitoi") return "chiitoi";
  return [...shape.melds.map((meld) => `${meld.kind}:${sortTiles(meld.tiles).join("")}`), `pair:${shape.pair.tiles[0]}`].sort().join("|");
}

export function defaultState() {
  return {
    winMethod: null,
    roundWind: "east",
    seatWind: "east",
    honba: 0,
    riichiSticks: 0,
    situation: {
      none: true,
      riichi: false,
      doubleRiichi: false,
      ippatsu: false,
      chankan: false,
      rinshan: false,
      haitei: false,
      houtei: false,
    },
    melds: [],
    winTile: null,
    lastKanWin: null,
    lastKanClosed: null,
    doraIndicators: [],
    uraIndicators: [],
  };
}

function safeBoolean(value) {
  return value === true;
}

function safeNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? Math.min(value, 99) : 0;
}

function safeHonba(value) {
  return Number.isInteger(value) && value >= 0 ? Math.min(value, MAX_HONBA) : 0;
}

function safeWind(value) {
  return WINDS.includes(value) ? value : "east";
}

function safeWinMethod(value) {
  return value === "ron" || value === "tsumo" ? value : null;
}

function safeTile(value, allowedTiles) {
  return allowedTiles.includes(value) ? value : null;
}

function safeSituation(value) {
  const base = defaultState().situation;
  if (!value || typeof value !== "object") return base;
  return Object.fromEntries(Object.keys(base).map((key) => [key, safeBoolean(value[key])]));
}

function safeMelds(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 7).flatMap((raw) => {
    if (!raw || !Array.isArray(raw.tiles)) return [];
    const tiles = raw.tiles.slice(0, 4);
    if (tiles.length < 2 || tiles.some((tile) => !ALL_TILES_37.includes(tile))) return [];
    const meld = createMeld(tiles, raw.open);
    return meld.kind === "unknown" ? [] : [{ tiles: meld.tiles, open: meld.open }];
  });
}

function safeIndicators(value) {
  const input = Array.isArray(value) ? value : [];
  return Array.from({ length: 5 }, (_, index) => safeTile(input[index], ALL_INDICATORS_34));
}

export function sanitizeStatePayload(payload) {
  const raw = payload && typeof payload === "object" ? payload : {};
  return createStateFromMelds({
    winMethod: safeWinMethod(raw.winMethod),
    roundWind: safeWind(raw.roundWind),
    seatWind: safeWind(raw.seatWind),
    honba: safeHonba(raw.honba),
    riichiSticks: safeNonNegativeInteger(raw.riichiSticks),
    situation: safeSituation(raw.situation),
    melds: safeMelds(raw.melds),
    winTile: safeTile(raw.winTile, ALL_TILES_37),
    lastKanWin: raw.lastKanWin === true || raw.lastKanWin === false ? raw.lastKanWin : null,
    lastKanClosed: raw.lastKanClosed === true || raw.lastKanClosed === false ? raw.lastKanClosed : null,
    doraIndicators: safeIndicators(raw.doraIndicators),
    uraIndicators: safeIndicators(raw.uraIndicators),
  });
}

function pushUniqueErrors(errors, additions) {
  for (const error of additions) {
    if (!errors.includes(error)) errors.push(error);
  }
}

function inferLastKanClosedFromMelds(melds = []) {
  const quads = (melds || []).filter((meld) => meld.kind === "quad");
  if (!quads.length) return null;
  const hasOpen = quads.some((meld) => meld.open);
  const hasClosed = quads.some((meld) => !meld.open);
  if (hasOpen && hasClosed) return null;
  return hasClosed;
}

function resolvedLastKanClosed(state) {
  return inferLastKanClosedFromMelds(state.melds || []) ?? state.lastKanClosed;
}

function requiredDoraIndicatorCount(state) {
  const quads = (state.melds || []).filter((meld) => meld.kind === "quad");
  let recognizedKanDora = quads.length;
  const lastKanClosed = resolvedLastKanClosed(state);
  if (state.situation?.rinshan && lastKanClosed !== true) recognizedKanDora -= 1;
  if (!state.situation?.rinshan && !state.situation?.chankan && state.winMethod === "ron" && state.lastKanWin === true) recognizedKanDora += 1;
  return 1 + Math.max(0, recognizedKanDora);
}

export function validateState(state) {
  const errors = [];
  if (!state.winMethod) errors.push("론/쯔모를 선택해주세요.");
  if (!state.melds?.length) errors.push("손패를 입력해주세요.");
  if (state.melds?.length && !state.winTile) errors.push("화료패를 선택해주세요.");
  const tiles = flattenMelds(state.melds || []);
  const winCandidates = winningTileCandidates(state.melds || [], { chankan: state.situation?.chankan });
  if (state.situation?.chankan && state.melds?.length && !winCandidates.length) errors.push("창깡은 슌쯔를 완성하는 화료만 가능합니다.");
  if (state.winTile && !winCandidates.includes(state.winTile)) {
    errors.push(state.situation?.chankan ? "창깡 화료패는 슌쯔 구성패 중에서 선택해야 합니다." : "화료패가 최종 손패에 없습니다.");
  }
  const needsUra = state.situation?.riichi || state.situation?.doubleRiichi;
  pushUniqueErrors(errors, validateTiles(tiles));
  pushUniqueErrors(errors, validateVisibleTiles([
    ...tiles,
    ...(state.doraIndicators || []).filter(Boolean),
    ...(needsUra ? (state.uraIndicators || []).filter(Boolean) : []),
  ]));
  if (!state.doraIndicators?.filter(Boolean).length) errors.push("도라 첫 칸을 입력해주세요.");
  const doraCount = leadingFilledCount(state.doraIndicators || []);
  const requiredDoraCount = requiredDoraIndicatorCount(state);
  if (doraCount < requiredDoraCount) {
    errors.push(`도라 표시패를 ${requiredDoraCount}개 이상 입력해주세요.`);
  }
  if (hasMiddleGap(state.doraIndicators || [])) errors.push("도라 중간 칸이 비어 있습니다.");
  if (needsUra) {
    if (hasMiddleGap(state.uraIndicators || [])) errors.push("우라도라 중간 칸이 비어 있습니다.");
    const uraCount = leadingFilledCount(state.uraIndicators || []);
    if (uraCount !== doraCount) errors.push("우라도라 개수가 도라 표시패 개수와 다릅니다.");
  }
  const activeSituations = Object.entries(state.situation || {}).filter(([key, value]) => key !== "none" && value);
  if (state.situation?.none && activeSituations.length) errors.push("해당없음은 다른 상황역과 함께 선택할 수 없습니다.");
  if (state.situation?.riichi && state.situation?.doubleRiichi) errors.push("리치와 더블리치는 동시에 선택할 수 없습니다.");
  if (state.situation?.ippatsu && !(state.situation?.riichi || state.situation?.doubleRiichi)) errors.push("일발은 리치 또는 더블리치가 있을 때만 선택할 수 있습니다.");
  if (state.situation?.haitei && state.situation?.houtei) errors.push("해저로월과 하저로어는 동시에 선택할 수 없습니다.");
  if (state.situation?.chankan && state.situation?.rinshan) errors.push("창깡과 영상개화는 동시에 선택할 수 없습니다.");
  if (state.situation?.rinshan && state.situation?.haitei) errors.push("영상개화와 해저로월은 동시에 선택할 수 없습니다.");
  if (state.situation?.chankan && state.situation?.houtei) errors.push("창깡과 하저로어는 동시에 선택할 수 없습니다.");
  if (state.situation?.rinshan && state.situation?.ippatsu) errors.push("영상개화와 일발은 동시에 선택할 수 없습니다.");
  if (state.situation?.chankan && state.situation?.doubleRiichi) errors.push("창깡과 더블리치는 동시에 선택할 수 없습니다.");
  if (state.situation?.ippatsu && state.lastKanWin === true && !state.situation?.chankan) errors.push("깡 직후 화료에서는 일발을 선택할 수 없습니다.");
  if (state.winMethod === "ron" && (state.situation?.haitei || state.situation?.rinshan)) errors.push("해저로월/영상개화는 쯔모 전용입니다.");
  if (state.winMethod === "tsumo" && (state.situation?.houtei || state.situation?.chankan)) errors.push("하저로어/창깡은 론 전용입니다.");
  const quads = (state.melds || []).filter((meld) => meld.kind === "quad");
  if (state.situation?.rinshan && !quads.length) errors.push("영상개화는 손패에 깡쯔가 있어야 합니다.");
  if (state.situation?.rinshan && state.lastKanWin === false) errors.push("영상개화는 깡 직후 화료여야 합니다.");
  if (state.situation?.rinshan && resolvedLastKanClosed(state) === null && quads.length) errors.push("쯔모 직전 깡 종류를 선택해주세요.");
  if (!state.situation?.rinshan && !state.situation?.chankan && state.lastKanWin === null) errors.push("마지막 깡 직후 질문에 응답해주세요.");
  if (state.lastKanWin === true && state.winMethod === "tsumo" && !state.situation?.rinshan) errors.push("깡 직후 쯔모라면 영상개화를 선택해야 합니다.");
  const hasOpen = (state.melds || []).some((meld) => meld.open);
  if (hasOpen && (state.situation?.riichi || state.situation?.doubleRiichi || state.situation?.ippatsu)) {
    errors.push("후로 손패에서는 리치/더블리치/일발을 선택할 수 없습니다.");
  }
  return errors;
}

function leadingFilledCount(values) {
  let count = 0;
  for (const value of values) {
    if (!value) break;
    count += 1;
  }
  return count;
}

function hasMiddleGap(values) {
  let seenGap = false;
  for (const value of values) {
    if (!value) seenGap = true;
    else if (seenGap) return true;
  }
  return false;
}

export function calculate(state) {
  const validationErrors = validateState(state);
  if (validationErrors.length) return { ok: false, errors: validationErrors };
  const shapes = decomposeHand(state.melds || []);
  if (!shapes.length) return { ok: false, errors: ["화료 형태를 만들 수 없습니다."] };

  const results = [];
  for (const shape of shapes) {
    for (const context of winningContexts(shape, state)) {
      const yakuman = detectYakuman(shape, state, context);
      if (yakuman) return { ok: false, errors: [`역만 손패입니다. 부수 계산 대상이 아닙니다. (${yakuman})`] };
      const baseYaku = detectYaku(shape, state, context);
      const handTiles = flattenMelds(state.melds || []);
      const dora = countDora(handTiles, state.doraIndicators || []);
      const ura = state.situation?.riichi || state.situation?.doubleRiichi ? countDora(handTiles, state.uraIndicators || [], { includeRed: false }) : 0;
      if (!baseYaku.length) {
        if (dora || ura) continue;
        continue;
      }
      const yaku = [...baseYaku];
      if (dora) yaku.push({ name: "도라", han: dora });
      if (ura) yaku.push({ name: "우라도라", han: ura });
      const han = yaku.reduce((sum, item) => sum + item.han, 0);
      const fuInfo = calculateFu(shape, state, context);
      const score = calculateScore({
        han,
        fu: fuInfo.fu,
        seatWind: state.seatWind,
        winMethod: state.winMethod,
        honba: state.honba,
        riichiSticks: state.riichiSticks,
      });
      results.push({
        ok: true,
        shape,
        key: `${resultKey(shape)}|win:${context.key}`,
        yaku,
        han,
        fu: han >= 5 ? null : fuInfo.fu,
        rawFu: fuInfo.rawFu,
        fuLines: han >= 5 ? [] : fuInfo.lines,
        wait: fuInfo.wait,
        score,
      });
    }
  }
  if (!results.length) return { ok: false, errors: ["도라만 있고 일반 역이 없습니다."] };
  results.sort(compareResults);
  return {
    ...results[0],
    alternatives: results.slice(1).filter((item) => item.score.total === results[0].score.total && item.han === results[0].han),
  };
}

export function createStateFromMelds(partial) {
  return {
    ...defaultState(),
    ...partial,
    situation: {
      ...defaultState().situation,
      ...(partial.situation || {}),
    },
    melds: (partial.melds || []).map((meld) => createMeld(meld.tiles, meld.open)),
  };
}

export function candidateMeldsFor(tile) {
  const normalized = normalizeTile(tile);
  const parsed = parseSuit(normalized);
  const candidates = [
    ...sameTileCandidateTiles(tile, 2).map((tiles) => ({ kind: "pair", tiles })),
    ...sameTileCandidateTiles(tile, 3).map((tiles) => ({ kind: "triplet", tiles })),
    ...sameTileCandidateTiles(tile, 4).map((tiles) => ({ kind: "quad", tiles })),
  ];
  if (parsed) {
    for (const start of [parsed.number - 2, parsed.number - 1, parsed.number]) {
      if (start >= 1 && start <= 7) {
        for (const tiles of sequenceCandidateTiles(tile, parsed.suit, start)) {
          candidates.push({ kind: "sequence", tiles });
        }
      }
    }
  }
  return dedupeCandidates(candidates);
}

export function winningTileCandidates(melds, { chankan = false } = {}) {
  if (chankan) {
    const sequenceTiles = new Set();
    for (const shape of decomposeHand(melds || [])) {
      if (shape.type !== "standard") continue;
      for (const meld of shape.melds) {
        if (meld.open || meld.kind !== "sequence") continue;
        for (const tile of meld.tiles) sequenceTiles.add(normalizeTile(tile));
      }
    }
    if (!sequenceTiles.size) return [];
    return uniquePhysicalTiles(flattenMelds((melds || []).map((raw) => raw.kind ? raw : createMeld(raw.tiles || [], raw.open)).filter((meld) => !meld.open && meld.kind !== "quad")))
      .filter((tile) => sequenceTiles.has(normalizeTile(tile)));
  }
  const eligible = [];
  for (const raw of melds || []) {
    const meld = raw.kind ? raw : createMeld(raw.tiles || [], raw.open);
    if (meld.open || meld.kind === "quad") continue;
    eligible.push(meld);
  }
  return uniquePhysicalTiles(flattenMelds(eligible));
}

export function encodeShareState(state) {
  return encodeCompactShareState(sanitizeStatePayload(state));
}

function encodeCompactShareState(state) {
  const head = [
    encodeWinMethod(state.winMethod),
    encodeWind(state.roundWind),
    encodeWind(state.seatWind),
    safeHonba(state.honba).toString(36),
  ].join("");
  return `${SHARE_VERSION_PREFIX}${[
    head,
    encodeSituation(state.situation).toString(36),
    encodeMelds(state.melds || []),
    encodeTile(state.winTile, ALL_TILES_37),
    `${encodeTriState(state.lastKanWin)}${encodeTriState(state.lastKanClosed)}`,
    encodeIndicators(state.doraIndicators || []),
    encodeIndicators(state.uraIndicators || []),
  ].join(SHARE_FIELD_SEPARATOR)}`;
}

function encodeWinMethod(value) {
  return { ron: "1", tsumo: "2" }[value] || "0";
}

function decodeWinMethod(value) {
  return { 1: "ron", 2: "tsumo" }[value] || null;
}

function encodeWind(value) {
  return String(Math.max(0, WINDS.indexOf(value)));
}

function decodeWind(value) {
  return WINDS[Number(value)] || "east";
}

function encodeSituation(situation = {}) {
  const keys = ["riichi", "doubleRiichi", "ippatsu", "chankan", "rinshan", "haitei", "houtei"];
  return keys.reduce((mask, key, index) => situation[key] ? mask | (1 << index) : mask, 0);
}

function decodeSituation(value) {
  const mask = Number.parseInt(value || "0", 36);
  const keys = ["riichi", "doubleRiichi", "ippatsu", "chankan", "rinshan", "haitei", "houtei"];
  const situation = { ...defaultState().situation, none: !mask };
  keys.forEach((key, index) => {
    situation[key] = Boolean(mask & (1 << index));
  });
  return situation;
}

function encodeTile(tile, allowedTiles) {
  if (!tile) return SHARE_NULL;
  const index = allowedTiles.indexOf(tile);
  if (index < 0) return SHARE_NULL;
  return SHARE_ALPHABET[index];
}

function decodeTile(value, allowedTiles) {
  if (!value || value === SHARE_NULL) return null;
  const index = SHARE_ALPHABET.indexOf(value);
  return index >= 0 ? allowedTiles[index] || null : null;
}

function encodeMelds(melds) {
  return melds
    .map((meld) => `${meld.open ? "o" : "c"}${meld.tiles.map((tile) => encodeTile(tile, ALL_TILES_37)).join("")}`)
    .join(SHARE_MELD_SEPARATOR);
}

function decodeMelds(value) {
  if (!value) return [];
  return value.split(SHARE_MELD_SEPARATOR).flatMap((raw) => {
    const openFlag = raw[0];
    if (openFlag !== "c" && openFlag !== "o") return [];
    const tiles = [...raw.slice(1)].map((tile) => decodeTile(tile, ALL_TILES_37));
    if (tiles.some((tile) => !tile)) return [];
    return [{ tiles, open: openFlag === "o" }];
  });
}

function encodeTriState(value) {
  if (value === true) return "1";
  if (value === false) return "0";
  return SHARE_NULL;
}

function decodeTriState(value) {
  if (value === "1") return true;
  if (value === "0") return false;
  return null;
}

function encodeIndicators(values) {
  return Array.from({ length: 5 }, (_, index) => encodeTile(values[index], ALL_INDICATORS_34)).join("");
}

function decodeIndicators(value) {
  return Array.from({ length: 5 }, (_, index) => decodeTile(value?.[index], ALL_INDICATORS_34));
}

function sameTileCandidateTiles(tile, length) {
  const normalized = normalizeTile(tile);
  const parsed = parseSuit(normalized);
  if (!parsed || parsed.number !== 5) return [Array.from({ length }, () => tile)];
  const normal = `${parsed.suit}5`;
  const red = `${parsed.suit}5r`;
  const withRed = [red, ...Array.from({ length: length - 1 }, () => normal)];
  if (tile === red || length === 4) return [withRed];
  return [Array.from({ length }, () => normal), withRed];
}

function sequenceCandidateTiles(selectedTile, suit, start) {
  const normalized = normalizeTile(selectedTile);
  const base = [`${suit}${start}`, `${suit}${start + 1}`, `${suit}${start + 2}`];
  const candidates = [
    base.map((item) => (item === normalized ? selectedTile : item)),
  ];
  const five = `${suit}5`;
  if (base.includes(five) && normalized !== five) {
    candidates.push(base.map((item) => (item === five ? `${suit}5r` : item)));
  }
  return candidates;
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const result = [];
  for (const candidate of candidates) {
    const key = `${candidate.kind}:${candidate.tiles.join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

export function decodeShareState(value) {
  if (typeof value !== "string") return null;
  if (value.length > MAX_SHARE_STATE_LENGTH) return null;
  if (value.startsWith(SHARE_VERSION_PREFIX)) return decodeCompactShareState(value);
  return decodeLegacyShareState(value);
}

function decodeCompactShareState(value) {
  try {
    const parts = value
      .slice(SHARE_VERSION_PREFIX.length)
      .split(SHARE_FIELD_SEPARATOR);
    if (parts.length !== 7) throw new Error("Invalid compact share state");
    const [head = "", situation = "0", melds = "", winTile = SHARE_NULL, kan = "", dora = "", ura = ""] = parts;
    if (head.length < 4) throw new Error("Invalid compact share state");
    const state = sanitizeStatePayload({
      winMethod: decodeWinMethod(head[0]),
      roundWind: decodeWind(head[1]),
      seatWind: decodeWind(head[2]),
      honba: Number.parseInt(head.slice(3), 36),
      situation: decodeSituation(situation),
      melds: decodeMelds(melds),
      winTile: decodeTile(winTile, ALL_TILES_37),
      lastKanWin: decodeTriState(kan[0]),
      lastKanClosed: decodeTriState(kan[1]),
      doraIndicators: decodeIndicators(dora),
      uraIndicators: decodeIndicators(ura),
    });
    if (encodeCompactShareState(state) !== value) throw new Error("Non-canonical compact share state");
    return state;
  } catch {
    return null;
  }
}

function decodeLegacyShareState(value) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const json = decodeURIComponent(escape(atob(padded)));
    const payload = JSON.parse(json);
    if (payload.v !== 1) throw new Error("Unsupported share version");
    return sanitizeStatePayload(payload);
  } catch {
    return null;
  }
}

export function sanitizeRecentItems(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item.label !== "string" || !item.state) return [];
    const state = sanitizeStatePayload(item.state);
    const result = calculate(state);
    if (!result.ok) return [];
    return [{
      at: typeof item.at === "string" ? item.at : "",
      label: item.label.slice(0, 140),
      state,
    }];
  }).slice(0, 20);
}
