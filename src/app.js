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
const TILE_IMAGE_CACHE = new Map();

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
      el("div", { className: "stepper-grid" }, [
        stepper("본장", state.honba, (value) => setState({ honba: value })),
        stepper("공탁", state.riichiSticks, (value) => setState({ riichiSticks: value })),
      ]),
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

function situationChips() {
  const item = (key, label, disabled = false) => chip(label, Boolean(state.situation[key]), () => toggleSituation(key), disabled);
  const riichiActive = state.situation.riichi || state.situation.doubleRiichi;
  const hasOpen = state.melds.some((meld) => meld.open);
  return [
    item("riichi", "리치", hasOpen || state.situation.doubleRiichi),
    item("doubleRiichi", "더블리치", hasOpen || state.situation.riichi),
    item("ippatsu", "일발", hasOpen || !riichiActive),
    item("chankan", "창깡", state.winMethod === "tsumo" || state.situation.rinshan),
    item("rinshan", "영상개화", state.winMethod === "ron" || state.situation.chankan),
    item("haitei", "해저모월", state.winMethod === "ron" || state.situation.houtei),
    item("houtei", "하저로어", state.winMethod === "tsumo" || state.situation.haitei),
    item("none", "해당없음"),
  ];
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
      state.melds.length ? el("div", { className: "meld-list" }, state.melds.map((meld, index) => meldBox(meld, index, winHighlight))) : el("p", { className: "panel-note", text: "아직 입력된 세트가 없습니다." }),
      el("p", { className: "panel-note", text: `현재 ${flattenMelds(state.melds).length}장 / ${complete ? "완성 후보 있음" : "미완성"}` }),
    ]),
    complete
      ? panel("화료패", null, [
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
    footer([
      { label: "전체 초기화", onClick: () => resetHand() },
      { label: "도라 입력으로", primary: true, disabled: !canStepTwoContinue(), onClick: () => goNext() },
    ]),
  ]);
}

function meldBox(meld, index, winHighlight) {
  return el("div", { className: "meld-box" }, [
    el("button", { className: "meld-remove", text: "x", onClick: () => removeMeld(index), ariaLabel: "세트 삭제" }),
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
  return el("button", { className: `tile-button ${active ? "active" : ""}`, onClick, ariaLabel: tileLabel(tile) }, [tileFace(tile)]);
}

function tileFace(tile, selected = false) {
  return el("span", { className: `tile ${tile.endsWith("5r") ? "red-five" : ""} ${selected ? "selected" : ""}` }, [
    el("img", {
      className: "tile-image",
      attrs: {
        src: tileImageSrc(tile),
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
    panel("깡 직후 판정", null, [
      el("div", { className: "button-grid" }, [
        button("예", state.lastKanWin === true, () => setState({ lastKanWin: true, lastKanClosed: null }), "primary"),
        button("아니오", state.lastKanWin === false, () => setState({ lastKanWin: false, lastKanClosed: null })),
      ]),
      shouldAskLastKanClosed ? lastKanClosedQuestion() : null,
      kanText ? el("div", { className: `${kanText.recognized ? "ok-note" : "alert"} kan-note`, text: kanText.text }) : null,
    ]),
    indicatorPanel("도라 표시패", null, "doraIndicators", false),
    indicatorPanel("우라도라 표시패", null, "uraIndicators", !needsUra),
    panel("표시패 선택", null, [
      activePicker ? tileGrid(ALL_INDICATORS_34, null, (tile) => setIndicatorTile(tile, activePicker)) : el("p", { className: "panel-note", text: "입력할 슬롯을 선택하세요." }),
    ]),
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
            } else {
              picker = { key, index };
              render();
            }
          },
        }, tile ? [tileFace(tile), el("span", { text: String(index + 1) })] : [el("span", { className: "slot-plus", text: "+" }), el("span", { text: String(index + 1) })]),
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
      ? `해당 깡으로 인한 ${label}는 인정됩니다. 포함하여 입력해주세요.`
      : `해당 깡으로 인한 ${label}는 인정되지 않습니다. 제외하고 입력해주세요.`,
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
      el("div", { text: result.score.dealer ? "친" : "자" }),
      el("div", { className: "score", text: result.score.display }),
      el("div", { className: "subscore", text: result.score.limitName || `${result.han}판 ${result.fu ?? "부수 무관"}부` }),
    ]),
    panel("역 목록", "도라/적도라/깡도라는 도라 N으로 합산한다.", [
      el("div", { className: "result-lines" }, result.yaku.map((item) => el("div", { className: "result-line" }, [el("span", { text: item.name }), el("span", { text: `${item.han}판` })]))),
      result.alternatives.length ? el("button", { className: "secondary-action", text: "동점 해석 보기", onClick: () => openAlternatives(result.alternatives) }) : null,
    ]),
    panel("부수 breakdown", result.han >= 5 ? "만관 이상은 부수 무관으로 축약한다." : null, [
      result.han >= 5
        ? el("p", { className: "muted", text: "부수 무관" })
        : el("div", { className: "result-lines" }, result.fuLines.map((line) => el("div", { className: "result-line" }, [el("span", { text: line.name }), el("span", { text: `+${line.fu}` })]))),
      result.han < 5 ? el("div", { className: "result-line" }, [el("strong", { text: "최종 올림" }), el("strong", { text: `${result.rawFu}부 -> ${result.fu}부` })]) : null,
    ]),
    panel("지불", "론은 방총자 1명 지불, 쯔모는 친/자 지불액을 구분한다.", [
      el("div", { className: "result-lines" }, result.score.payments.map((payment) => el("div", { className: "result-line" }, [el("span", { text: payment.label }), el("strong", { text: `${payment.amount}점` })]))),
      el("p", { className: "panel-note", text: `총 수입 ${result.score.total}점 / 본장 ${state.honba} / 공탁 ${state.riichiSticks}` }),
    ]),
  ]);
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
  const messages = [];
  if (!state.melds.length) messages.push("손패 미완성: 세트를 입력해주세요.");
  else if (!isHandComplete()) messages.push("손패 미완성 또는 화료 형태 불가: 4몸통+1머리 또는 치또이 형태가 필요합니다.");
  if (isHandComplete() && !state.winTile) messages.push("화료패를 선택해주세요.");
  return messages;
}

function visibleHandErrors() {
  const errors = handErrors();
  if (!state.melds.length) return [];
  if (!isHandComplete()) return [];
  return errors;
}

function doraValidationErrors() {
  const messages = [];
  if (state.lastKanWin === null) messages.push("마지막 깡 직후 질문에 응답해주세요.");
  if (needsLastKanClosedQuestion()) messages.push("마지막 깡 종류를 선택해주세요.");
  const dora = normalizedSlots(state.doraIndicators);
  if (!dora[0]) messages.push("도라 첫 칸을 입력해주세요.");
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

function tileImageSrc(tile) {
  if (TILE_IMAGE_CACHE.has(tile)) return TILE_IMAGE_CACHE.get(tile);
  const parts = tileImageParts(tile);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="88" viewBox="0 0 64 88">
      <defs>
        <linearGradient id="face" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#fffdf4"/>
          <stop offset="1" stop-color="#efe5cf"/>
        </linearGradient>
        <linearGradient id="side" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#96c8b7"/>
          <stop offset="1" stop-color="#518878"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="145%" height="145%">
          <feDropShadow dx="0" dy="2.4" stdDeviation="1.3" flood-color="#173d35" flood-opacity=".38"/>
        </filter>
      </defs>
      <path d="M12 6h36c6 0 10 5 10 11v53c0 7-5 12-12 12H13c-4 0-7-3-7-7V13c0-4 2-7 6-7z" fill="url(#side)" filter="url(#shadow)"/>
      <path d="M9 7h36c6 0 10 5 10 11v51c0 6-4 10-10 10H10c-4 0-7-3-7-7V14c0-4 2-7 6-7z" fill="url(#face)" stroke="#4f8175" stroke-width="1.6"/>
      <path d="M13 13h29" stroke="#fffaf0" stroke-width="2.4" opacity=".95"/>
      <rect x="11" y="14" width="34" height="55" rx="5" fill="#fffaf0" opacity=".42"/>
      ${tileMarkSvg(parts)}
    </svg>
  `.trim();
  const uri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  TILE_IMAGE_CACHE.set(tile, uri);
  return uri;
}

function tileImageParts(tile) {
  const normalized = tile.endsWith("5r") ? `${tile[0]}5` : tile;
  const match = /^([mps])([1-9])$/.exec(normalized);
  if (match) {
    return {
      type: "suit",
      suit: match[1],
      number: Number(match[2]),
      red: tile.endsWith("5r"),
    };
  }
  return {
    type: "honor",
    label: tileLabel(tile),
    color: tile === "red" ? "#b34239" : tile === "green" ? "#257353" : "#251f18",
  };
}

function tileMarkSvg(parts) {
  if (parts.type === "honor") {
    return `<text x="29" y="52" text-anchor="middle" font-family="Wanted Sans, Arial, sans-serif" font-size="27" font-weight="900" fill="${parts.color}">${escapeSvg(parts.label)}</text>`;
  }
  if (parts.suit === "m") return manMarkSvg(parts);
  if (parts.suit === "p") return pinMarkSvg(parts);
  return souMarkSvg(parts);
}

function manMarkSvg(parts) {
  const fill = parts.red ? "#b34239" : "#251f18";
  return `
    <text x="29" y="43" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="900" fill="${fill}">${parts.number}</text>
    <text x="29" y="60" text-anchor="middle" font-family="Wanted Sans, Arial, sans-serif" font-size="13" font-weight="900" fill="${fill}">萬</text>
  `;
}

function pinMarkSvg(parts) {
  const fill = parts.red ? "#b34239" : "#256f9c";
  return dotLayout(parts.number)
    .map(([x, y], index) => {
      const dotFill = parts.red || index % 2 === 0 ? fill : "#251f18";
      return `<circle cx="${29 + x}" cy="${42 + y}" r="4.2" fill="none" stroke="${dotFill}" stroke-width="2.1"/><circle cx="${29 + x}" cy="${42 + y}" r="1.35" fill="${dotFill}"/>`;
    })
    .join("");
}

function souMarkSvg(parts) {
  const fill = parts.red ? "#b34239" : "#257353";
  return dotLayout(parts.number)
    .map(([x, y]) => `<rect x="${26 + x}" y="${35 + y}" width="6" height="14" rx="3" fill="${fill}"/><path d="M${29 + x} ${36 + y}v12" stroke="#fffaf0" stroke-width="1.2" opacity=".7"/>`)
    .join("");
}

function dotLayout(number) {
  return {
    1: [[0, 0]],
    2: [[-7, -8], [7, 8]],
    3: [[-8, -10], [0, 0], [8, 10]],
    4: [[-8, -11], [8, -11], [-8, 11], [8, 11]],
    5: [[-9, -12], [9, -12], [0, 0], [-9, 12], [9, 12]],
    6: [[-9, -14], [9, -14], [-9, 0], [9, 0], [-9, 14], [9, 14]],
    7: [[-9, -15], [9, -15], [-9, -3], [9, -3], [0, 8], [-9, 17], [9, 17]],
    8: [[-9, -17], [9, -17], [-9, -6], [9, -6], [-9, 6], [9, 6], [-9, 17], [9, 17]],
    9: [[-10, -17], [0, -17], [10, -17], [-10, 0], [0, 0], [10, 0], [-10, 17], [0, 17], [10, 17]],
  }[number];
}

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    label: `${result.score.dealer ? "친" : "자"} ${state.winMethod === "ron" ? "론" : "쯔모"} ${result.score.display} / ${result.han}판 ${result.fu ?? "부수 무관"}부`,
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
        ? el("div", {}, recent.map((item) => el("button", { className: "recent-item", text: item.label, onClick: () => restoreRecent(item) })))
        : el("p", { className: "panel-note", text: "저장된 최근계산이 없습니다." }),
      recent.length ? el("button", { className: "secondary-action", text: "전체 삭제", onClick: () => { localStorage.removeItem(RECENT_KEY); render(); } }) : null,
    ];
  } else if (modal?.type === "alternatives") {
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "동점 해석" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      ...modal.alternatives.map((item) => el("div", { className: "recent-item", text: `${item.han}판 ${item.fu ?? "부수 무관"}부 / ${item.score.display}` })),
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
  state = createStateFromMelds(safeItem.state);
  step = 4;
  modal = null;
  selectedTile = null;
  selectedCandidate = null;
  picker = null;
  render();
}
