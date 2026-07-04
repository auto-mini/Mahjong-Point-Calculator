import {
  ALL_INDICATORS_34,
  ALL_TILES_37,
  calculate,
  candidateMeldsFor,
  createMeld,
  createStateFromMelds,
  decodeShareState,
  defaultState,
  decomposeHand,
  encodeShareState,
  flattenMelds,
  sanitizeRecentItems,
  tileLabel,
  winningTileCandidates,
} from "./domain.js";

const RECENT_KEY = "riichi-fu-calculator-recent-v1";
const app = document.querySelector("#app");
const TILE_ASSET_ROOT = "./assets/tiles/b2";
const WIN_TILE_REQUIRED_TEXT = "화료패를 선택해주세요.";
const TILE_ASSET_FILES = {
  m1: "Man1.png",
  m2: "Man2.png",
  m3: "Man3.png",
  m4: "Man4.png",
  m5: "Man5.png",
  m5r: "Man5-Dora.png",
  m6: "Man6.png",
  m7: "Man7.png",
  m8: "Man8.png",
  m9: "Man9.png",
  p1: "Pin1.png",
  p2: "Pin2.png",
  p3: "Pin3.png",
  p4: "Pin4.png",
  p5: "Pin5.png",
  p5r: "Pin5-Dora.png",
  p6: "Pin6.png",
  p7: "Pin7.png",
  p8: "Pin8.png",
  p9: "Pin9.png",
  s1: "Sou1.png",
  s2: "Sou2.png",
  s3: "Sou3.png",
  s4: "Sou4.png",
  s5: "Sou5.png",
  s5r: "Sou5-Dora.png",
  s6: "Sou6.png",
  s7: "Sou7.png",
  s8: "Sou8.png",
  s9: "Sou9.png",
  east: "Ton.png",
  south: "Nan.png",
  west: "Shaa.png",
  north: "Pei.png",
  white: "Haku.png",
  green: "Hatsu.png",
  red: "Chun.png",
};

let initialShareError = null;
let lastSavedRecentKey = null;
let state = loadInitialState();
let step = state.winMethod ? 2 : 1;
let selectedTile = null;
let selectedCandidate = null;
let picker = null;
let modal = null;
let latestResult = null;

render();

function loadInitialState() {
  if (location.hash.startsWith("#s=")) {
    const decoded = decodeShareState(location.hash.slice(3));
    if (decoded) return normalizeUiState(decoded);
    initialShareError = "공유 링크를 읽을 수 없음";
  }
  return normalizeUiState(defaultState());
}

function setState(next) {
  initialShareError = null;
  state = normalizeUiState(createStateFromMelds({
    ...state,
    ...next,
    situation: {
      ...state.situation,
      ...(next.situation || {}),
    },
  }));
  if (closedOnlyInput()) selectedCandidate = null;
  render();
}

function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.type) node.type = options.type;
  if (options.disabled) node.disabled = true;
  if (options.ariaLabel) node.setAttribute("aria-label", options.ariaLabel);
  if (options.title) node.title = options.title;
  if (options.onClick) node.addEventListener("click", options.onClick);
  for (const [name, value] of Object.entries(options.attrs || {})) node.setAttribute(name, value);
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined) continue;
    node.append(child);
  }
  return node;
}

function render() {
  latestResult = calculate(state);
  app.replaceChildren(nav(), page());
  document.body.append(...renderModal());
}

function nav() {
  const titles = ["화료/국 정보", "손패 입력", "도라/우라", "결과"];
  const topbar = el("section", { className: "topbar" });
  topbar.append(step > 1 ? el("button", { className: "back-button", text: "<", onClick: () => goBack() }) : el("span", { className: "back-spacer" }));
  const title = el("div", {}, [
    el("div", { className: "page-kicker", text: `${step}/4` }),
    el("h1", { text: titles[step - 1] }),
  ]);
  topbar.append(title);
  topbar.append(el("button", { className: "recent-button", text: "최근계산", onClick: () => openRecent() }));
  return topbar;
}

function progress() {
  const labels = ["국", "패", "도라", "결과"];
  return el(
    "section",
    { className: "progress" },
    labels.map((label, index) =>
      el("button", {
        className: `progress-pill ${step === index + 1 ? "active" : ""}`,
        text: label,
        disabled: index + 1 > maxReachableStep(),
        onClick: () => {
          if (index + 1 <= maxReachableStep()) {
            step = index + 1;
            render();
          }
        },
      }),
    ),
  );
}

function page() {
  if (step === 1) return pageOne();
  if (step === 2) return pageTwo();
  if (step === 3) return pageThree();
  return pageFour();
}

function panel(title, note, children = []) {
  return el("section", { className: "panel" }, [
    el("h2", { text: title }),
    ...children,
  ]);
}

function button(label, active, onClick, extra = "") {
  return el("button", { className: `choice ${extra} ${active ? "active" : ""}`, text: label, onClick });
}

function chip(label, active, onClick, disabled = false) {
  return el("button", { className: `chip ${active ? "active" : ""}`, text: label, onClick, disabled });
}

function pageOne() {
  return el("div", {}, [
    initialShareError ? el("div", { className: "alert page-alert", text: initialShareError }) : null,
    panel("화료 방식", null, [
      el("div", { className: "button-grid" }, [
        button("론", state.winMethod === "ron", () => setWinMethod("ron"), "primary"),
        button("쯔모", state.winMethod === "tsumo", () => setWinMethod("tsumo"), "primary"),
      ]),
    ]),
    panel("국 정보", null, [
      windSection("장풍", "roundWind"),
      windSection("자풍", "seatWind"),
      honbaSection(),
    ]),
    panel("특정 상황역", null, [
      el("div", { className: "chip-grid two" }, situationChips()),
    ]),
    footer([{ label: "손패 입력으로", primary: true, disabled: !canStepOneContinue(), onClick: () => goNext() }]),
  ]);
}

function setWinMethod(method) {
  setState({ winMethod: state.winMethod === method ? null : method });
}

function normalizeUiState(rawState) {
  const next = createStateFromMelds(rawState);
  next.riichiSticks = 0;
  next.situation = normalizeSituationForUi(next.situation, next.winMethod, next.melds);
  if (!isHandComplete(next.melds) || !winningTileCandidates(next.melds).includes(next.winTile)) next.winTile = null;
  return next;
}

function normalizeSituationForUi(situation, winMethod, melds = []) {
  const next = { ...situation };
  if (winMethod === "ron") {
    next.rinshan = false;
    next.haitei = false;
  }
  if (winMethod === "tsumo") {
    next.chankan = false;
    next.houtei = false;
  }
  if (melds.some((meld) => meld.open)) {
    next.riichi = false;
    next.doubleRiichi = false;
    next.ippatsu = false;
  }
  if (next.riichi) next.doubleRiichi = false;
  if (next.doubleRiichi) next.riichi = false;
  if (!next.riichi && !next.doubleRiichi) next.ippatsu = false;
  if (next.haitei) next.houtei = false;
  if (next.houtei) next.haitei = false;
  if (next.chankan) next.rinshan = false;
  if (next.rinshan) next.chankan = false;
  if (!Object.entries(next).some(([keyName, value]) => keyName !== "none" && value)) next.none = true;
  else next.none = false;
  return next;
}

function windSection(label, key) {
  const options = [
    ["east", "동"],
    ["south", "남"],
    ["west", "서"],
    ["north", "북"],
  ];
  return el("div", {}, [
    el("div", { className: "label", text: label }),
    el(
      "div",
      { className: "wind-grid" },
      options.map(([value, text]) => chip(text, state[key] === value, () => setState({ [key]: value }))),
    ),
  ]);
}

function stepper(label, value, onChange) {
  return el("div", {}, [
    el("div", { className: "label", text: label }),
    el("div", { className: "stepper" }, [
      el("button", { text: "-", onClick: () => onChange(Math.max(0, value - 1)) }),
      el("span", { text: String(value) }),
      el("button", { text: "+", onClick: () => onChange(value + 1) }),
    ]),
  ]);
}

function honbaSection() {
  const options = Array.from({ length: 9 }, (_, index) => index);
  return el("div", {}, [
    el("div", { className: "label", text: "본장" }),
    el("div", { className: "honba-grid" }, options.map((value) => chip(`${value}`, state.honba === value, () => setState({ honba: value })))),
  ]);
}

function situationChips() {
  const item = (key, label) => chip(label, Boolean(state.situation[key]), () => toggleSituation(key));
  const riichiActive = state.situation.riichi || state.situation.doubleRiichi;
  const hasOpen = state.melds.some((meld) => meld.open);
  const chips = [
    !hasOpen && !state.situation.doubleRiichi ? item("riichi", "리치") : null,
    !hasOpen && !state.situation.riichi ? item("doubleRiichi", "더블리치") : null,
    !hasOpen && riichiActive ? item("ippatsu", "일발") : null,
    state.winMethod === "ron" && !state.situation.rinshan ? item("chankan", "창깡") : null,
    state.winMethod === "tsumo" && !state.situation.chankan ? item("rinshan", "영상개화") : null,
    state.winMethod === "tsumo" && !state.situation.houtei ? item("haitei", "해저로월") : null,
    state.winMethod === "ron" && !state.situation.haitei ? item("houtei", "하저로어") : null,
    item("none", "해당없음"),
  ];
  return chips.filter(Boolean);
}

function toggleSituation(key) {
  const next = { ...state.situation };
  if (key === "none") {
    for (const item of Object.keys(next)) next[item] = false;
    next.none = true;
  } else {
    next[key] = !next[key];
    next.none = false;
  }
  if (next.riichi) next.doubleRiichi = false;
  if (next.doubleRiichi) next.riichi = false;
  if (!next.riichi && !next.doubleRiichi) next.ippatsu = false;
  if (next.haitei) next.houtei = false;
  if (next.houtei) next.haitei = false;
  if (next.chankan) next.rinshan = false;
  if (next.rinshan) next.chankan = false;
  if (!Object.entries(next).some(([keyName, value]) => keyName !== "none" && value)) next.none = true;
  setState({ situation: next });
}

function pageTwo() {
  const complete = isHandComplete();
  const errors = visibleHandErrors();
  const winHighlight = { used: false };
  return el("div", {}, [
    panel("현재 손패", null, [
      state.melds.length ? el("div", { className: "meld-list" }, state.melds.map((meld, index) => meldBox(meld, index, winHighlight))) : null,
      el("p", { className: "panel-note", text: `현재 ${flattenMelds(state.melds).length}장 / ${complete ? "완성가능" : "미완성"}` }),
      el("div", { className: "hand-actions" }, [
        el("button", { className: "secondary-action hand-reset", text: "전체 초기화", disabled: !state.melds.length, onClick: () => resetHand() }),
      ]),
    ]),
    complete
      ? panel("화료패", null, [
          !state.winTile ? el("p", { className: "panel-note win-note", text: WIN_TILE_REQUIRED_TEXT }) : null,
          el("div", { className: "win-candidates" }, winningTileCandidates(state.melds).map((tile) => tileButton(tile, () => setState({ winTile: tile }), state.winTile === tile))),
        ])
      : null,
    !complete
      ? panel("패 선택", null, [
          selectedTile
            ? el("div", { className: "selected-tile-row" }, [tileButton(selectedTile, () => {
                selectedTile = null;
                selectedCandidate = null;
                render();
              }, true)])
            : tileGrid(ALL_TILES_37, selectedTile, (tile) => {
                selectedTile = tile;
                selectedCandidate = null;
                render();
              }),
        ])
      : null,
    selectedTile && !complete ? candidatePanel() : null,
    errors.length ? panel("확인 필요", null, errors.map((message) => el("div", { className: "alert", text: message }))) : null,
    footer([{ label: "도라 입력으로", primary: true, disabled: !canStepTwoContinue(), onClick: () => goNext() }]),
  ]);
}

function meldBox(meld, index, winHighlight) {
  return el("div", { className: "meld-box" }, [
    el("button", { className: "meld-remove", text: "×", onClick: () => removeMeld(index), ariaLabel: "세트 삭제" }),
    tileRow(meld.tiles, state.winTile, winHighlight),
    el("div", { className: "meld-kind", text: `${kindLabel(meld.kind)}${meld.open ? " / 후로" : ""}` }),
  ]);
}

function tileGrid(tiles, activeTile, onSelect) {
  const groups = [
    ["만", orderedSuitTiles(tiles, "m")],
    ["통", orderedSuitTiles(tiles, "p")],
    ["삭", orderedSuitTiles(tiles, "s")],
    ["자", tiles.filter((tile) => !isNumberTileId(tile))],
  ];
  return el(
    "div",
    { className: "tile-grid" },
    groups.map(([label, group]) =>
      el("div", { className: "tile-grid-row" }, [
        el("div", { className: "label", text: label }),
        el("div", { className: "tile-row" }, group.map((tile) => tileButton(tile, () => onSelect(tile), activeTile === tile))),
      ]),
    ),
  );
}

function tileButton(tile, onClick, active = false) {
  return el("button", { className: `tile-button ${active ? "active" : ""}`, onClick, ariaLabel: tileLabel(tile) }, [
    tileFace(tile, active),
    el("span", { className: "tile-caption", text: compactTileLabel(tile) }),
  ]);
}

function compactTileLabel(tile) {
  const suited = /^([mps])([1-9])$/.exec(tile.endsWith("5r") ? `${tile[0]}5` : tile);
  return suited ? suited[2] : tileLabel(tile);
}

function tileFace(tile, selected = false) {
  const classes = ["tile"];
  if (tile.endsWith("5r")) classes.push("red-five");
  if (selected) classes.push("selected");
  return el("span", { className: classes.join(" ") }, [
    el("img", {
      className: "tile-image",
      attrs: {
        src: tileAssetSrc(tile),
        alt: tileLabel(tile),
        draggable: "false",
      },
    }),
  ]);
}

function tileRow(tiles, selectedTileForHighlight = null, highlightTracker = null) {
  return el("div", { className: "tile-row" }, tiles.map((tile) => {
    const selected = shouldHighlightTile(tile, selectedTileForHighlight, highlightTracker);
    return tileFace(tile, selected);
  }));
}

function shouldHighlightTile(tile, selectedTileForHighlight, highlightTracker) {
  if (!selectedTileForHighlight || tile !== selectedTileForHighlight) return false;
  if (!highlightTracker) return true;
  if (highlightTracker.used) return false;
  highlightTracker.used = true;
  return true;
}

function orderedSuitTiles(tiles, suit) {
  const wanted = ["1", "2", "3", "4", "5", "5r", "6", "7", "8", "9"].map((value) => `${suit}${value}`);
  return wanted.filter((tile) => tiles.includes(tile));
}

function isNumberTileId(tile) {
  return /^(?:[mps][1-9]|[mps]5r)$/.test(tile);
}

function candidatePanel() {
  const candidates = viableCandidatesForSelectedTile();
  const groups = groupCandidates(candidates);
  return panel("후보군", null, [
    selectedCandidate
      ? el("div", { className: "selected-candidate" }, [
          candidateBox(selectedCandidate),
          el("div", { className: "candidate-controls" }, [
            el("span", { className: "label", text: "후로여부" }),
            el("div", { className: "candidate-action-row" }, [
              el("button", { className: "candidate-action", text: "O", onClick: () => addCandidate(selectedCandidate, true) }),
              el("button", { className: "candidate-action", text: "X", onClick: () => addCandidate(selectedCandidate, false) }),
            ]),
          ]),
        ])
      : el(
          "div",
          { className: "candidate-section" },
          Object.entries(groups).map(([kind, groupCandidates]) =>
            el("div", { className: "candidate-group" }, [
              el("div", { className: "label", text: kindLabel(kind) }),
              el("div", { className: "candidate-options" }, groupCandidates.map((candidate) => candidateBox(candidate))),
            ]),
          ),
        ),
  ]);
}

function viableCandidatesForSelectedTile() {
  const usedTiles = flattenMelds(state.melds);
  return candidateMeldsFor(selectedTile).filter((candidate) => !candidateWouldBreakTileCounts(candidate, usedTiles));
}

function candidateWouldBreakTileCounts(candidate, usedTiles) {
  const tiles = [...usedTiles, ...candidate.tiles];
  const normalizedCounts = new Map();
  for (const tile of tiles.map((item) => item.endsWith("5r") ? `${item[0]}5` : item)) {
    normalizedCounts.set(tile, (normalizedCounts.get(tile) || 0) + 1);
  }
  if ([...normalizedCounts.values()].some((count) => count > 4)) return true;
  return ["m5r", "p5r", "s5r"].some((red) => tiles.filter((tile) => tile === red).length > 1);
}

function groupCandidates(candidates) {
  return candidates.reduce((groups, candidate) => {
    groups[candidate.kind] ||= [];
    groups[candidate.kind].push(candidate);
    return groups;
  }, {});
}

function candidateBox(candidate) {
  const active = selectedCandidate && candidateKey(selectedCandidate) === candidateKey(candidate);
  return el("button", {
    className: `candidate-box ${active ? "active" : ""}`,
    onClick: () => {
      if (candidate.kind === "pair") addCandidate(candidate, false);
      else if (closedOnlyInput()) addCandidate(candidate, false);
      else {
        selectedCandidate = active ? null : candidate;
        render();
      }
    },
  }, [tileRow(candidate.tiles)]);
}

function candidateKey(candidate) {
  return `${candidate.kind}:${candidate.tiles.join(",")}`;
}

function addCandidate(candidate, open) {
  if (state.melds.length >= 7) return;
  const meld = createMeld(candidate.tiles, open);
  selectedTile = null;
  selectedCandidate = null;
  setState({ melds: [...state.melds, meld] });
}

function closedOnlyInput() {
  return state.situation.riichi || state.situation.doubleRiichi || state.situation.ippatsu;
}

function removeMeld(index) {
  const melds = state.melds.filter((_, itemIndex) => itemIndex !== index);
  const keepWinTile = isHandComplete(melds) && winningTileCandidates(melds).includes(state.winTile);
  setState({ melds, winTile: keepWinTile ? state.winTile : null });
}

function resetHand() {
  selectedTile = null;
  selectedCandidate = null;
  setState({ melds: [], winTile: null });
}

function pageThree() {
  const doraErrors = doraValidationErrors();
  const needsUra = state.situation.riichi || state.situation.doubleRiichi;
  const shouldAskLastKanClosed = shouldAskLastKanClosedQuestion();
  const kanText = kanJudgementText();
  const activePicker = picker;
  return el("div", {}, [
    panel("깡 직후에 화료했나요?", null, [
      el("div", { className: "button-grid" }, [
        button("예", state.lastKanWin === true, () => setState({ lastKanWin: true, lastKanClosed: null }), "primary"),
        button("아니오", state.lastKanWin === false, () => setState({ lastKanWin: false, lastKanClosed: null })),
      ]),
      shouldAskLastKanClosed ? lastKanClosedQuestion() : null,
      kanText ? el("div", { className: `${kanText.recognized ? "ok-note" : "alert"} kan-note`, text: kanText.text }) : null,
    ]),
    indicatorPanel("도라 표시패", null, "doraIndicators", false),
    indicatorPanel("우라도라 표시패", null, "uraIndicators", !needsUra),
    activePicker ? panel("표시패 선택", null, [tileGrid(ALL_INDICATORS_34, null, (tile) => setIndicatorTile(tile, activePicker))]) : null,
    shouldShowDoraErrors() && doraErrors.length ? panel("확인 필요", null, doraErrors.map((message) => el("div", { className: "alert", text: message }))) : null,
    footer([{ label: "결과 보기", primary: true, disabled: !canStepThreeContinue(), onClick: () => goNext() }]),
  ]);
}

function lastKanClosedQuestion() {
  return el("div", { className: "kan-extra" }, [
    el("div", { className: "label", text: "마지막 깡 종류" }),
    el("div", { className: "button-grid" }, [
      button("안깡", state.lastKanClosed === true, () => setState({ lastKanClosed: true }), "primary"),
      button("안깡 아님", state.lastKanClosed === false, () => setState({ lastKanClosed: false })),
    ]),
  ]);
}

function indicatorPanel(title, note, key, disabled) {
  const values = normalizedSlots(state[key] || []);
  return panel(title, note, [
    el(
      "div",
      { className: "slot-row" },
      values.map((tile, index) =>
        el("button", {
          className: `slot ${picker?.key === key && picker.index === index ? "active" : ""}`,
          disabled,
          onClick: () => {
            if (tile) {
              const next = [...values];
              next[index] = null;
              picker = null;
              setState({ [key]: next });
            } else if (picker?.key === key && picker.index === index) {
              picker = null;
              render();
            } else {
              picker = { key, index };
              render();
            }
          },
        }, tile ? [tileFace(tile)] : [el("span", { className: "slot-plus", text: "+" }), el("span", { className: "slot-index", text: String(index + 1) })]),
      ),
    ),
  ]);
}

function normalizedSlots(values) {
  return Array.from({ length: 5 }, (_, index) => values[index] || null);
}

function setIndicatorTile(tile, target = picker) {
  if (!target) return;
  const next = normalizedSlots(state[target.key]);
  next[target.index] = tile;
  picker = null;
  setState({ [target.key]: next });
}

function kanJudgementText() {
  if (state.lastKanWin !== true) return null;
  if (needsLastKanClosedQuestion()) return null;
  const withUra = state.situation.riichi || state.situation.doubleRiichi;
  const label = withUra ? "도라와 우라도라" : "도라";
  const recognized = isLastKanDoraRecognized();
  return {
    recognized,
    text: recognized
      ? `해당 깡으로 인한 ${label}는 인정됩니다.\n포함하여 입력해주세요.`
      : `해당 깡으로 인한 ${label}는 인정되지 않습니다.\n제외하고 입력해주세요.`,
  };
}

function pageFour() {
  const result = calculate(state);
  return el("div", {}, [
    result.ok ? resultView(result) : errorResult(result.errors),
    footer([
      { label: "공유", onClick: () => shareCurrentState() },
      { label: "다시 계산", primary: true, onClick: () => resetAll() },
    ]),
  ]);
}

function resultView(result) {
  autoSaveRecent(result);
  return el("div", {}, [
    el("section", { className: "result-card" }, [
      el("div", { className: "result-role", text: `${result.score.dealer ? "오야" : "자"} ${state.winMethod === "ron" ? "론" : "쯔모"}` }),
      el("div", { className: "score", text: totalScoreDisplay(result.score) }),
      el("div", { className: "subscore", text: result.score.limitName || hanFuLabel(result) }),
    ]),
    panel("역 목록", "도라/적도라/깡도라는 도라 N으로 합산한다.", [
      el("div", { className: "result-lines yaku-lines" }, result.yaku.map((item) => el("div", { className: "result-line" }, [el("span", { text: item.name }), el("span", { text: `${item.han}판` })]))),
      result.alternatives.length ? el("button", { className: "secondary-action", text: "동점 해석 보기", onClick: () => openAlternatives(result.alternatives) }) : null,
    ]),
    panel("부수 breakdown", result.han >= 5 ? "만관 이상은 부수 무관으로 축약한다." : null, [
      result.han >= 5
        ? el("p", { className: "muted", text: "부수 무관" })
        : el("div", { className: "result-lines" }, fuBreakdownRows(result)),
    ]),
    paymentPanel(result),
  ]);
}

function paymentPanel(result) {
  return el("section", { className: "panel payment-panel" }, [
    el("div", { className: "payment-row" }, [
      el("h2", { text: "지불" }),
      el("strong", { className: "payment-amount", text: paymentDisplay(result.score) }),
    ]),
  ]);
}

function fuBreakdownRows(result) {
  const rows = [];
  const meldLines = result.fuLines.filter(isMeldFuLine);
  const meldTotal = meldLines.reduce((sum, line) => sum + line.fu, 0);
  let meldSummaryAdded = false;
  for (const line of result.fuLines) {
    if (isMeldFuLine(line)) {
      if (!meldSummaryAdded) {
        rows.push(el("button", {
          className: "result-line result-line-button",
          onClick: () => openFuDetails(meldLines),
          title: "커쯔/깡쯔 세부 부수 보기",
        }, [el("span", { text: "커쯔/깡쯔" }), el("span", { text: `+${meldTotal}` })]));
        meldSummaryAdded = true;
      }
      continue;
    }
    rows.push(el("div", { className: "result-line" }, [el("span", { text: line.name }), el("span", { text: `+${line.fu}` })]));
  }
  rows.push(el("div", { className: "result-line" }, [el("strong", { text: "최종 올림" }), el("strong", { text: `${result.rawFu}부 -> ${result.fu}부` })]));
  return rows;
}

function isMeldFuLine(line) {
  return / (커쯔|깡쯔)$/.test(line.name);
}

function openFuDetails(lines) {
  modal = { type: "fu-details", lines };
  render();
}

function totalScoreDisplay(score) {
  return `${score.total}점`;
}

function paymentDisplay(score) {
  return score.display.replace("/", " / ").replace("점", "");
}

function hanFuLabel(result) {
  return result.han >= 5 ? `${result.han}판` : `${result.han}판 ${result.fu}부`;
}

function errorResult(errors) {
  return el("section", { className: "result-card" }, [
    el("div", { text: "계산 불가" }),
    el("div", { className: "score", text: "확인 필요" }),
    ...errors.map((message) => el("div", { className: "alert", text: message })),
  ]);
}

function footer(actions) {
  const section = el("section", { className: `footer ${actions.length === 1 ? "single" : ""}` });
  for (const action of actions) {
    section.append(
      el("button", {
        className: `footer-button ${action.primary ? "primary" : ""}`,
        text: action.label,
        disabled: action.disabled,
        onClick: action.onClick,
      }),
    );
  }
  return section;
}

function goBack() {
  step = Math.max(1, step - 1);
  render();
}

function goNext() {
  if (step === 2) selectedTile = null;
  if (step === 3 && latestResult?.ok) saveRecent(latestResult, false);
  step = Math.min(4, step + 1);
  render();
}

function maxReachableStep() {
  if (!canStepOneContinue()) return 1;
  if (!canStepTwoContinue()) return 2;
  if (!canStepThreeContinue()) return 3;
  return 4;
}

function canStepOneContinue() {
  return Boolean(state.winMethod);
}

function isHandComplete(melds = state.melds) {
  const tiles = flattenMelds(melds);
  const quads = melds.filter((meld) => meld.kind === "quad").length;
  const plausibleCount = tiles.length === 14 + quads;
  return plausibleCount && decomposeHand(melds).length > 0;
}

function canStepTwoContinue() {
  return isHandComplete() && Boolean(state.winTile);
}

function canStepThreeContinue() {
  return doraValidationErrors().length === 0 && !needsLastKanClosedQuestion();
}

function handErrors() {
  const messages = handStructureWarnings();
  if (!state.melds.length) messages.push("손패 미완성: 세트를 입력해주세요.");
  else if (!isHandComplete()) messages.push("손패 미완성 또는 화료 형태 불가: 4몸통+1머리 또는 치또이 형태가 필요합니다.");
  if (isHandComplete() && !state.winTile) messages.push(WIN_TILE_REQUIRED_TEXT);
  return messages;
}

function visibleHandErrors() {
  const structureWarnings = handStructureWarnings();
  if (structureWarnings.length) return structureWarnings;
  const errors = handErrors().filter((message) => message !== WIN_TILE_REQUIRED_TEXT);
  if (!state.melds.length) return [];
  if (!isHandComplete()) return [];
  return errors;
}

function handStructureWarnings() {
  const pairCount = state.melds.filter((meld) => meld.kind === "pair").length;
  const bodyCount = state.melds.filter((meld) => ["sequence", "triplet", "quad"].includes(meld.kind)).length;
  const messages = [];
  if (pairCount >= 2 && bodyCount >= 1) {
    messages.push("머리가 2개 이상인데 몸통이 함께 입력되어 있습니다. 치또이는 머리만 7개 입력해야 합니다.");
  }
  if (bodyCount >= 5) {
    messages.push("몸통이 5개 이상입니다. 일반 화료는 몸통 4개와 머리 1개여야 합니다.");
  }
  return messages;
}

function doraValidationErrors() {
  const messages = [];
  if (state.lastKanWin === null) messages.push("마지막 깡 직후 질문에 응답해주세요.");
  if (needsLastKanClosedQuestion()) messages.push("마지막 깡 종류를 선택해주세요.");
  const dora = normalizedSlots(state.doraIndicators);
  if (!dora[0]) messages.push("도라 첫 칸을 입력해주세요.");
  if (state.lastKanWin === true && isLastKanDoraRecognized() && leadingCount(dora) < 2) {
    messages.push("해당 깡으로 인한 도라가 인정됩니다. 도라 표시패를 2개 이상 입력해주세요.");
  }
  if (hasMiddleGap(dora)) messages.push("도라 중간 칸이 비어 있습니다.");
  if (state.situation.riichi || state.situation.doubleRiichi) {
    const ura = normalizedSlots(state.uraIndicators);
    if (hasMiddleGap(ura)) messages.push("우라도라 중간 칸이 비어 있습니다.");
    if (leadingCount(ura) !== leadingCount(dora)) messages.push("우라도라 개수가 도라 표시패 개수와 다릅니다.");
  }
  return messages;
}

function shouldShowDoraErrors() {
  return normalizedSlots(state.doraIndicators).some(Boolean) || normalizedSlots(state.uraIndicators).some(Boolean);
}

function leadingCount(values) {
  let count = 0;
  for (const value of values) {
    if (!value) break;
    count += 1;
  }
  return count;
}

function hasMiddleGap(values) {
  let gap = false;
  for (const value of values) {
    if (!value) gap = true;
    else if (gap) return true;
  }
  return false;
}

function resetAll() {
  state = normalizeUiState(defaultState());
  step = 1;
  selectedTile = null;
  selectedCandidate = null;
  picker = null;
  modal = null;
  initialShareError = null;
  lastSavedRecentKey = null;
  location.hash = "";
  render();
}

function shortTile(tile) {
  const label = tileLabel(tile);
  return label.replace("만", "萬").replace("통", "筒").replace("삭", "索").replace("적5", "赤");
}

function tileAssetSrc(tile) {
  return `${TILE_ASSET_ROOT}/${TILE_ASSET_FILES[tile]}`;
}

function quads() {
  return state.melds.filter((meld) => meld.kind === "quad");
}

function needsLastKanClosedQuestion() {
  return shouldAskLastKanClosedQuestion() && state.lastKanClosed === null;
}

function shouldAskLastKanClosedQuestion() {
  const handQuads = quads();
  return state.lastKanWin === true && handQuads.length >= 2 && handQuads.some((meld) => meld.open) && handQuads.some((meld) => !meld.open);
}

function isLastKanDoraRecognized() {
  if (state.situation.chankan) return false;
  const handQuads = quads();
  if (!handQuads.length) return false;
  const lastKanClosed = state.lastKanClosed ?? (handQuads.length === 1 ? !handQuads[0].open : !handQuads.some((meld) => meld.open));
  if (state.situation.rinshan) return lastKanClosed;
  return true;
}

function kindLabel(kind) {
  return {
    pair: "머리",
    sequence: "슌쯔",
    triplet: "커쯔",
    quad: "깡쯔",
  }[kind] || kind;
}

function saveRecent(result, rerender = true) {
  if (!result?.ok) return;
  lastSavedRecentKey = recentKey(result);
  const item = {
    at: new Date().toISOString(),
    label: recentLabel(result, state),
    state: JSON.parse(JSON.stringify({
      ...state,
      melds: state.melds.map((meld) => ({ tiles: meld.tiles, open: meld.open })),
    })),
  };
  const recent = readRecent().filter((entry) => entry.label !== item.label);
  recent.unshift(item);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)));
  if (rerender) render();
}

function recentLabel(result, sourceState) {
  return `${result.score.dealer ? "오야" : "자"} ${sourceState.winMethod === "ron" ? "론" : "쯔모"} ${totalScoreDisplay(result.score)} / ${hanFuLabel(result)}`;
}

function recentItemLabel(item) {
  const recentState = normalizeUiState(item.state);
  const result = calculate(recentState);
  return result.ok ? recentLabel(result, recentState) : item.label;
}

function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return sanitizeRecentItems(parsed);
  } catch {
    return [];
  }
}

function autoSaveRecent(result) {
  const key = recentKey(result);
  if (key !== lastSavedRecentKey) saveRecent(result, false);
}

function recentKey(result) {
  return `${encodeShareState(state)}|${result.score.display}|${result.han}|${result.fu ?? "x"}`;
}

function openRecent() {
  modal = "recent";
  render();
}

function openAlternatives(alternatives) {
  modal = { type: "alternatives", alternatives };
  render();
}

async function shareCurrentState() {
  const url = `${location.origin}${location.pathname}#s=${encodeShareState(state)}`;
  location.hash = `s=${encodeShareState(state)}`;
  try {
    await navigator.clipboard?.writeText(url);
  } catch {
    // Clipboard is optional; the visible URL box remains the fallback.
  }
  modal = { type: "share", url };
  render();
}

function renderModal() {
  document.querySelectorAll(".modal-backdrop").forEach((node) => node.remove());
  if (!modal) return [];
  const close = () => {
    modal = null;
    render();
  };
  let body;
  if (modal === "recent") {
    const recent = readRecent();
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "최근계산" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      recent.length
        ? el("div", { className: "recent-list" }, recent.map((item) => el("button", { className: "recent-item", text: recentItemLabel(item), onClick: () => restoreRecent(item) })))
        : el("p", { className: "panel-note", text: "저장된 최근계산이 없습니다." }),
      recent.length ? el("button", { className: "secondary-action recent-clear", text: "전체 삭제", onClick: () => { localStorage.removeItem(RECENT_KEY); render(); } }) : null,
    ];
  } else if (modal?.type === "alternatives") {
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "동점 해석" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      ...modal.alternatives.map((item) => el("div", { className: "recent-item", text: `${totalScoreDisplay(item.score)} / ${hanFuLabel(item)}` })),
    ];
  } else if (modal?.type === "fu-details") {
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "커쯔/깡쯔 세부" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      el("div", { className: "result-lines" }, modal.lines.map((line) => el("div", { className: "result-line" }, [el("span", { text: line.name }), el("span", { text: `+${line.fu}` })]))),
    ];
  } else if (modal?.type === "restore-error") {
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "복원 실패" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      el("p", { className: "panel-note", text: "localStorage 기록 복원 실패. 저장된 입력값을 다시 검증하는 중 오류가 발생했습니다." }),
    ];
  } else {
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "공유 링크" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      el("div", { className: "copy-box", text: modal.url }),
    ];
  }
  return [
    el("section", { className: "modal-backdrop", onClick: close }, [
      el("div", { className: "sheet", onClick: (event) => event.stopPropagation() }, body),
    ]),
  ];
}

function restoreRecent(item) {
  const [safeItem] = sanitizeRecentItems([item]);
  if (!safeItem) {
    modal = { type: "restore-error" };
    render();
    return;
  }
  state = normalizeUiState(safeItem.state);
  step = 4;
  modal = null;
  selectedTile = null;
  selectedCandidate = null;
  picker = null;
  render();
}
