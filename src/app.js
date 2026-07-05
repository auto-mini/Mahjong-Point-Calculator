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
  normalizeTile,
  sanitizeRecentItems,
  tileLabel,
  validateVisibleTiles,
  winningTileCandidates,
} from "./domain.js";

const RECENT_KEY = "riichi-fu-calculator-recent-v1";
const RECENT_STORAGE_MAX_LENGTH = 80_000;
const app = document.querySelector("#app");
const TILE_ASSET_ROOT = "./assets/tiles/b2";
const WIN_TILE_REQUIRED_TEXT = "화료패를 선택해주세요.";
const CANDIDATE_KIND_ORDER = ["pair", "sequence", "triplet", "quad"];
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
let step = stepForLoadedState(state);
let selectedTile = null;
let selectedCandidate = null;
let picker = null;
let modal = null;
let modalReturnFocus = null;
let latestResult = null;
let renderVersion = 0;
const TAP_ACTIVATION_DELAY_MS = 140;

render();
window.addEventListener("hashchange", restoreStateFromHash);

function loadInitialState() {
  if (location.hash.startsWith("#s=")) {
    const decoded = decodeShareState(location.hash.slice(3));
    if (decoded) return normalizeUiState(decoded);
    initialShareError = "공유 링크를 읽을 수 없음";
  }
  return normalizeUiState(defaultState());
}

function restoreStateFromHash() {
  if (!location.hash.startsWith("#s=")) {
    if (!location.hash || location.hash === "#") {
      initialShareError = null;
      state = normalizeUiState(defaultState());
      step = 1;
      selectedTile = null;
      selectedCandidate = null;
      picker = null;
      modal = null;
      modalReturnFocus = null;
      lastSavedRecentKey = null;
      render();
    }
    return;
  }
  const decoded = decodeShareState(location.hash.slice(3));
  if (!decoded) {
    initialShareError = "공유 링크를 읽을 수 없음";
    state = normalizeUiState(defaultState());
    step = 1;
    selectedTile = null;
    selectedCandidate = null;
    picker = null;
    modal = null;
    modalReturnFocus = null;
    lastSavedRecentKey = null;
    render();
    return;
  }
  const next = normalizeUiState(decoded);
  applyRestoredState(next);
}

function setState(next) {
  initialShareError = null;
  const meldsChanged = Object.prototype.hasOwnProperty.call(next, "melds");
  state = normalizeUiState(createStateFromMelds({
    ...state,
    ...next,
    situation: {
      ...state.situation,
      ...(next.situation || {}),
    },
  }));
  if (meldsChanged && state.situation.rinshan && inferLastKanClosedFromMelds(state.melds) === null) {
    state.lastKanClosed = null;
  }
  if (closedOnlyInput()) selectedCandidate = null;
  if (location.hash.startsWith("#s=")) history.replaceState(null, "", location.pathname);
  render();
}

function stepForLoadedState(loadedState) {
  if (!loadedState.winMethod) return 1;
  if (calculate(loadedState).ok) return 4;
  if (!isRestoredHandComplete(loadedState) || !loadedState.winTile || handContextErrorsFor(loadedState).length) return 2;
  return 3;
}

function isRestoredHandComplete(loadedState) {
  const tiles = flattenMelds(loadedState.melds);
  const quads = loadedState.melds.filter((meld) => meld.kind === "quad").length;
  return tiles.length === 14 + quads && decomposeHand(loadedState.melds).length > 0;
}

function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.type) node.type = options.type;
  if (options.disabled) node.disabled = true;
  if (options.ariaLabel) node.setAttribute("aria-label", options.ariaLabel);
  if (options.ariaPressed !== undefined) node.setAttribute("aria-pressed", String(options.ariaPressed));
  if (options.title) node.title = options.title;
  if (options.value !== undefined) node.value = options.value;
  if (options.readOnly) node.readOnly = true;
  if (options.onKeydown) node.addEventListener("keydown", options.onKeydown);
  if (tag === "button") attachTapFeedback(node, options.onClick, options.instantClick);
  else if (options.onClick) node.addEventListener("click", options.onClick);
  for (const [name, value] of Object.entries(options.attrs || {})) node.setAttribute(name, value);
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined) continue;
    node.append(child);
  }
  return node;
}

function pairRow(className, left, right, tag = "div") {
  return el(tag, { className, ariaLabel: `${left} ${right}` }, [el("span", { text: `${left} ` }), el("span", { text: right })]);
}

function attachTapFeedback(node, onClick, instantClick = false) {
  let releaseTimer = null;
  const release = () => {
    window.clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(() => node.classList.remove("tap-press"), 130);
  };
  const snap = () => {
    node.classList.remove("tap-snap");
    void node.offsetWidth;
    node.classList.add("tap-snap");
    window.setTimeout(() => node.classList.remove("tap-snap"), 260);
  };
  node.addEventListener("pointerdown", () => {
    if (node.disabled) return;
    window.clearTimeout(releaseTimer);
    node.classList.add("tap-press");
  });
  node.addEventListener("pointerup", release);
  node.addEventListener("pointercancel", release);
  node.addEventListener("pointerleave", release);
  node.addEventListener("touchstart", () => {
    if (node.disabled) return;
    window.clearTimeout(releaseTimer);
    node.classList.add("tap-press");
  }, { passive: true });
  node.addEventListener("touchend", release, { passive: true });
  node.addEventListener("touchcancel", release, { passive: true });
  node.addEventListener("click", (event) => {
    if (node.disabled) return;
    const clickRenderVersion = renderVersion;
    release();
    snap();
    if (!onClick) return;
    if (instantClick) {
      onClick(event);
      return;
    }
    event.preventDefault();
    window.setTimeout(() => {
      if (!node.isConnected || clickRenderVersion !== renderVersion) return;
      onClick(event);
    }, TAP_ACTIVATION_DELAY_MS);
  });
}

function render({ preserveModalFocus = false } = {}) {
  const modalFocus = preserveModalFocus ? modalFocusSnapshot() : null;
  renderVersion += 1;
  latestResult = calculate(state);
  clearModalNodes();
  app.replaceChildren(nav(), page());
  const modalNodes = renderModal();
  app.inert = modalNodes.length > 0;
  if (modalNodes.length) app.setAttribute("aria-hidden", "true");
  else app.removeAttribute("aria-hidden");
  document.body.append(...modalNodes);
  if (restoreModalFocusSnapshot(modalFocus)) return;
  focusModal();
}

function clearModalNodes() {
  for (const node of document.querySelectorAll(".modal-backdrop")) {
    node.remove();
  }
}

function nav() {
  const titles = ["화료/국 정보", "손패 입력", "도라/우라", "결과"];
  const topbar = el("section", { className: "topbar" });
  topbar.append(step > 1 ? el("button", { className: "back-button", text: "<", ariaLabel: "이전 페이지로", onClick: () => goBack() }) : el("span", { className: "back-spacer" }));
  const title = el("div", {}, [
    el("div", { className: "page-kicker", text: `${step}/4` }),
    el("h1", { text: titles[step - 1] }),
  ]);
  topbar.append(title);
  topbar.append(el("button", { className: "recent-button", text: "최근계산", ariaLabel: "최근계산 열기", onClick: () => openRecent() }));
  return topbar;
}

function page() {
  if (step === 1) return pageOne();
  if (step === 2) return pageTwo();
  if (step === 3) return pageThree();
  return pageFour();
}

function panel(title, children = []) {
  return el("section", { className: "panel" }, [
    el("h2", { text: title }),
    ...children,
  ]);
}

function button(label, active, onClick, extra = "") {
  return el("button", { className: `choice ${extra} ${active ? "active" : ""}`, text: label, onClick, ariaPressed: active });
}

function chip(label, active, onClick, disabled = false, ariaLabel = null) {
  return el("button", { className: `chip ${active ? "active" : ""}`, text: label, onClick, disabled, ariaPressed: active, ariaLabel });
}

function pageOne() {
  return el("div", {}, [
    initialShareError ? el("div", { className: "alert page-alert", text: initialShareError, attrs: { role: "alert" } }) : null,
    panel("화료 방식", [
      el("div", { className: "button-grid" }, [
        button("론", state.winMethod === "ron", () => setWinMethod("ron"), "primary"),
        button("쯔모", state.winMethod === "tsumo", () => setWinMethod("tsumo"), "primary"),
      ]),
    ]),
    panel("국 정보", [
      windSection("장풍", "roundWind"),
      windSection("자풍", "seatWind"),
      honbaSection(),
    ]),
    panel("특정 상황역", [
      el("div", { className: "chip-grid two" }, situationChips()),
    ]),
    footer([{ label: "손패 입력으로", primary: true, disabled: !canStepOneContinue(), onClick: () => goNext() }]),
  ]);
}

function setWinMethod(method) {
  const nextMethod = state.winMethod === method ? null : method;
  setState({ winMethod: nextMethod, lastKanWin: null, lastKanClosed: null });
}

function normalizeUiState(rawState) {
  const next = createStateFromMelds(rawState);
  next.riichiSticks = 0;
  next.situation = normalizeSituationForUi(next.situation, next.winMethod, next.melds);
  if (next.situation.chankan || next.situation.rinshan) next.lastKanWin = true;
  if (next.situation.rinshan) {
    const inferredLastKanClosed = inferLastKanClosedFromMelds(next.melds);
    if (inferredLastKanClosed !== null) next.lastKanClosed = inferredLastKanClosed;
  } else {
    next.lastKanClosed = null;
  }
  if (!next.situation.riichi && !next.situation.doubleRiichi) next.uraIndicators = [];
  if (!isHandComplete(next.melds) || !winningTileCandidates(next.melds, { chankan: next.situation.chankan }).includes(next.winTile)) next.winTile = null;
  return next;
}

function normalizeSituationForUi(situation, winMethod, melds = []) {
  const next = { ...situation };
  if (!winMethod) {
    next.chankan = false;
    next.rinshan = false;
    next.haitei = false;
    next.houtei = false;
  }
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
  if (next.rinshan) {
    next.haitei = false;
    next.ippatsu = false;
  }
  if (next.chankan) {
    next.houtei = false;
    next.doubleRiichi = false;
  }
  if (!next.riichi && !next.doubleRiichi) next.ippatsu = false;
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
      { className: "wind-grid", attrs: { role: "group", "aria-label": label } },
      options.map(([value, text]) => chip(text, state[key] === value, () => setState({ [key]: value }), false, `${label} ${text}`)),
    ),
  ]);
}

function honbaSection() {
  const options = Array.from({ length: 9 }, (_, index) => index);
  return el("div", {}, [
    el("div", { className: "label", text: "본장" }),
    el("div", { className: "honba-grid", attrs: { role: "group", "aria-label": "본장" } }, options.map((value) => chip(`${value}`, state.honba === value, () => setState({ honba: value }), false, `${value}본장`))),
  ]);
}

function situationChips() {
  const item = (key, label) => chip(label, Boolean(state.situation[key]), () => toggleSituation(key));
  const riichiActive = state.situation.riichi || state.situation.doubleRiichi;
  const hasOpen = state.melds.some((meld) => meld.open);
  const chips = [
    !hasOpen && !state.situation.doubleRiichi ? item("riichi", "리치") : null,
    !hasOpen && !state.situation.riichi && !state.situation.chankan ? item("doubleRiichi", "더블리치") : null,
    !hasOpen && riichiActive && !state.situation.rinshan ? item("ippatsu", "일발") : null,
    state.winMethod === "ron" && !state.situation.rinshan && !state.situation.houtei && !state.situation.doubleRiichi ? item("chankan", "창깡") : null,
    state.winMethod === "tsumo" && !state.situation.chankan && !state.situation.haitei && !state.situation.ippatsu ? item("rinshan", "영상개화") : null,
    state.winMethod === "tsumo" && !state.situation.houtei && !state.situation.rinshan ? item("haitei", "해저로월") : null,
    state.winMethod === "ron" && !state.situation.haitei && !state.situation.chankan ? item("houtei", "하저로어") : null,
    item("none", "해당없음"),
  ];
  return chips.filter(Boolean);
}

function toggleSituation(key) {
  const next = { ...state.situation };
  const hadImpliedLastKanWin = state.situation.chankan || state.situation.rinshan;
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
  if (next.rinshan) {
    next.haitei = false;
    next.ippatsu = false;
  }
  if (next.chankan) {
    next.houtei = false;
    next.doubleRiichi = false;
  }
  if (!next.riichi && !next.doubleRiichi) next.ippatsu = false;
  if (!Object.entries(next).some(([keyName, value]) => keyName !== "none" && value)) next.none = true;
  const hasImpliedLastKanWin = next.chankan || next.rinshan;
  setState({
    situation: next,
    ...(hadImpliedLastKanWin && !hasImpliedLastKanWin ? { lastKanWin: null, lastKanClosed: null } : {}),
  });
}

function pageTwo() {
  const complete = isHandComplete();
  const errors = visibleHandErrors();
  const winHighlight = { used: false };
  return el("div", {}, [
    panel("현재 손패", [
      state.melds.length ? el("div", { className: "meld-list" }, state.melds.map((meld, index) => meldBox(meld, index, winHighlight))) : null,
      el("p", { className: "panel-note", text: `현재 ${flattenMelds(state.melds).length}장 / ${complete ? "완성가능" : "미완성"}` }),
      el("div", { className: "hand-actions" }, [
        el("button", { className: "secondary-action hand-reset", text: "전체 초기화", disabled: !state.melds.length, onClick: () => resetHand() }),
      ]),
    ]),
    complete
      ? panel("화료패", [
          !state.winTile ? el("p", { className: "panel-note win-note", text: WIN_TILE_REQUIRED_TEXT }) : null,
          el("div", { className: "win-candidates" }, currentWinningTileCandidates().map((tile) => tileButton(tile, () => setState({ winTile: tile }), state.winTile === tile))),
        ])
      : null,
    !complete
      ? panel("패 선택", [
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
    errors.length ? panel("확인 필요", errors.map((message) => el("div", { className: "alert", text: message, attrs: { role: "alert" } }))) : null,
    footer([{ label: "도라 입력으로", primary: true, disabled: !canStepTwoContinue(), onClick: () => goNext() }]),
  ]);
}

function meldBox(meld, index, winHighlight) {
  return el("div", { className: "meld-box" }, [
    el("button", { className: "meld-remove", text: "×", onClick: () => removeMeld(index, meldStateKey(meld)), ariaLabel: `${index + 1}번째 ${kindLabel(meld.kind)} 삭제` }),
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
  return el("button", { className: `tile-button ${active ? "active" : ""}`, onClick, ariaLabel: tileLabel(tile), ariaPressed: active }, [
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
  const activeCandidate = selectedCandidate;
  return panel("후보군", [
    activeCandidate
      ? el("div", { className: "selected-candidate" }, [
          candidateBox(activeCandidate),
          el("div", { className: "candidate-controls" }, [
            el("span", { className: "label", text: "후로여부" }),
            el("div", { className: "candidate-action-row" }, [
              el("button", { className: "candidate-action", text: "O", ariaLabel: "후로로 등록", onClick: () => addCandidate(activeCandidate, true) }),
              el("button", { className: "candidate-action", text: "X", ariaLabel: "멘젠으로 등록", onClick: () => addCandidate(activeCandidate, false) }),
            ]),
          ]),
        ])
        : el(
          "div",
          { className: "candidate-section" },
          CANDIDATE_KIND_ORDER.filter((kind) => groups[kind]?.length).map((kind) =>
            el("div", { className: "candidate-group" }, [
              el("div", { className: "label", text: kindLabel(kind) }),
              el("div", { className: "candidate-options" }, groups[kind].map((candidate) => candidateBox(candidate))),
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
  for (const suit of ["m", "p", "s"]) {
    if (tiles.filter((tile) => tile === `${suit}5`).length > 3) return true;
  }
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
  const label = `${kindLabel(candidate.kind)} ${candidate.tiles.map(tileLabel).join(" ")}`;
  return el("button", {
    className: `candidate-box ${active ? "active" : ""}`,
    ariaLabel: label,
    ariaPressed: active,
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
  if (!candidate || candidateWouldBreakTileCounts(candidate, flattenMelds(state.melds))) return;
  if (!selectedTile || !candidate.tiles.includes(selectedTile)) return;
  if (state.melds.length >= 7) return;
  const meld = createMeld(candidate.tiles, open);
  if (meld.kind === "unknown") return;
  selectedTile = null;
  selectedCandidate = null;
  setState({ melds: [...state.melds, meld] });
}

function closedOnlyInput() {
  return state.situation.riichi || state.situation.doubleRiichi || state.situation.ippatsu;
}

function removeMeld(index, expectedKey = null) {
  if (expectedKey && meldStateKey(state.melds[index]) !== expectedKey) return;
  const melds = state.melds.filter((_, itemIndex) => itemIndex !== index);
  const keepWinTile = isHandComplete(melds) && winningTileCandidates(melds, { chankan: state.situation.chankan }).includes(state.winTile);
  setState({ melds, winTile: keepWinTile ? state.winTile : null });
}

function meldStateKey(meld) {
  return meld ? `${meld.open ? "o" : "c"}:${meld.kind}:${meld.tiles.join(",")}` : "";
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
  const shouldAskLastKanWin = shouldAskLastKanWinQuestion();
  if (!needsUra && picker?.key === "uraIndicators") picker = null;
  const activePicker = picker;
  return el("div", {}, [
    panel(shouldAskLastKanWin ? "깡 직후에 화료했나요?" : "깡도라 판정", [
      shouldAskLastKanWin
        ? el("div", { className: "button-grid" }, [
            button("예", state.lastKanWin === true, () => setState({ lastKanWin: true, lastKanClosed: null }), "primary"),
            button("아니오", state.lastKanWin === false, () => setState({ lastKanWin: false, lastKanClosed: null })),
          ])
        : null,
      shouldAskLastKanClosed ? lastKanClosedQuestion() : null,
      kanText ? el("div", { className: `${kanText.recognized ? "ok-note" : "alert"} kan-note`, text: kanText.text, attrs: kanText.recognized ? {} : { role: "alert" } }) : null,
    ]),
    indicatorPanel("도라 표시패", "doraIndicators"),
    needsUra ? indicatorPanel("우라도라 표시패", "uraIndicators") : null,
    activePicker ? panel("표시패 선택", [tileGrid(ALL_INDICATORS_34, null, (tile) => setIndicatorTile(tile, activePicker))]) : null,
    doraErrors.length ? panel("확인 필요", doraErrors.map((message) => el("div", { className: "alert", text: message, attrs: { role: "alert" } }))) : null,
    footer([{ label: "결과 보기", primary: true, disabled: !canStepThreeContinue(), onClick: () => goNext() }]),
  ]);
}

function lastKanClosedQuestion() {
  return el("div", { className: "kan-extra" }, [
    el("div", { className: "label", text: "쯔모 직전 깡 종류" }),
    el("div", { className: "button-grid" }, [
      button("안깡", state.lastKanClosed === true, () => setState({ lastKanClosed: true }), "primary"),
      button("안깡 아님", state.lastKanClosed === false, () => setState({ lastKanClosed: false })),
    ]),
  ]);
}

function indicatorPanel(title, key) {
  const values = normalizedSlots(state[key] || []);
  return panel(title, [
    el(
      "div",
      { className: "slot-row" },
      values.map((tile, index) =>
        el("button", {
          className: `slot ${picker?.key === key && picker.index === index ? "active" : ""}`,
          ariaLabel: tile ? `${title} ${index + 1}: ${tileLabel(tile)}` : `${title} ${index + 1} 선택`,
          ariaPressed: picker?.key === key && picker.index === index,
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
        }, tile ? [tileFace(tile)] : [el("span", { className: "slot-plus", text: "+" })]),
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
  const label = kanDoraLabel();
  if (state.situation.chankan) {
    return { recognized: false, text: `창깡 성립시, 해당 깡으로 인한 ${label}는 추가되지 않습니다.` };
  }
  if (state.situation.rinshan) {
    if (needsLastKanClosedQuestion()) return null;
    const lastKanClosed = resolvedLastKanClosed();
    if (!quads().length || lastKanClosed === null) return null;
    const recognized = lastKanClosed === true;
    return {
      recognized,
      text: recognized
        ? `쯔모 직전의 깡으로 인한 ${label}는 추가해야 합니다.`
        : `쯔모 직전의 깡으로 인한 ${label}는 추가되지 않습니다.`,
    };
  }
  if (state.lastKanWin !== true) return null;
  if (state.winMethod === "ron") {
    return { recognized: true, text: `론 직전의 깡으로 인한 ${label}는 추가해야 합니다.` };
  }
  return { recognized: false, text: "깡 직후 쯔모라면 영상개화를 선택해야 합니다." };
}

function kanDoraLabel() {
  return state.situation.riichi || state.situation.doubleRiichi ? "도라와 우라도라" : "도라";
}

function pageFour() {
  const result = calculate(state);
  return el("div", {}, [
    result.ok ? resultView(result) : errorResult(result.errors),
    footer([
      { label: "공유", onClick: () => shareCurrentState(), instant: true },
      { label: "다시 계산", primary: true, onClick: () => resetAll() },
    ]),
  ]);
}

function resultView(result) {
  autoSaveRecent(result);
  return el("div", {}, [
    el("section", { className: "result-card", ariaLabel: `최종 결과 ${result.score.dealer ? "오야" : "자"} ${state.winMethod === "ron" ? "론" : "쯔모"} ${totalScoreDisplay(result.score)} ${scoreDetailLabel(result)}` }, [
      el("div", { className: "result-role", text: `${result.score.dealer ? "오야" : "자"} ${state.winMethod === "ron" ? "론" : "쯔모"} ` }),
      el("div", { className: "score", text: `${totalScoreDisplay(result.score)} ` }),
      el("div", { className: "subscore", text: scoreDetailLabel(result) }),
    ]),
    panel("역 목록", [
      el("div", { className: "result-lines yaku-lines" }, result.yaku.map((item) => pairRow("result-line", item.name, `${item.han}판`))),
      result.alternatives.length ? el("button", { className: "secondary-action", text: "동점 해석 보기", onClick: () => openAlternatives(result.alternatives) }) : null,
    ]),
    panel("부수 계산", [
      result.han >= 5
        ? el("p", { className: "muted", text: "부수 무관" })
        : el("div", { className: "result-lines" }, fuBreakdownRows(result)),
    ]),
    paymentPanel(result),
  ]);
}

function paymentPanel(result) {
  return el("section", { className: "panel payment-panel" }, [
    el("div", { className: "payment-row", ariaLabel: `지불 ${paymentDisplay(result.score)}` }, [
      el("h2", { text: "지불 " }),
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
          ariaLabel: `커쯔/깡쯔 +${meldTotal}`,
          onClick: () => openFuDetails(meldLines),
          title: "커쯔/깡쯔 세부 부수 보기",
        }, [el("span", { text: "커쯔/깡쯔 " }), el("span", { text: `+${meldTotal}` })]));
        meldSummaryAdded = true;
      }
      continue;
    }
    rows.push(pairRow("result-line", line.name, `+${line.fu}`));
  }
  const finalFuText = result.rawFu === result.fu ? `${result.fu}부` : `${result.rawFu}부 -> ${result.fu}부`;
  const finalFuLabel = result.rawFu === result.fu ? "최종 부수" : "최종 올림";
  rows.push(el("div", { className: "result-line", ariaLabel: `${finalFuLabel} ${finalFuText}` }, [el("strong", { text: `${finalFuLabel} ` }), el("strong", { text: finalFuText })]));
  return rows;
}

function isMeldFuLine(line) {
  return / (커쯔|깡쯔)$/.test(line.name);
}

function openFuDetails(lines) {
  openModal({ type: "fu-details", lines }, () => document.querySelector(".result-line-button"));
}

function totalScoreDisplay(score) {
  return `${score.total}점`;
}

function paymentDisplay(score) {
  return score.display.replace("/", " / ").replace("점", "");
}

function hanFuLabel(result) {
  return result.fu === null ? `${result.han}판` : `${result.han}판 ${result.fu}부`;
}

function scoreDetailLabel(result) {
  if (result.score.limitName && result.fu !== null) return `${hanFuLabel(result)} / ${result.score.limitName}`;
  if (result.score.limitName) return `${result.han}판 / ${result.score.limitName}`;
  return hanFuLabel(result);
}

function yakuSummary(yaku) {
  return yaku.map((item) => `${item.name} ${item.han}판`).join(", ");
}

function errorResult(errors) {
  return el("section", { className: "result-card" }, [
    el("div", { text: "계산 불가" }),
    el("div", { className: "score", text: "확인 필요" }),
    ...errors.map((message) => el("div", { className: "alert", text: message, attrs: { role: "alert" } })),
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
        instantClick: action.instant,
      }),
    );
  }
  return section;
}

function goBack() {
  const nextStep = Math.max(1, step - 1);
  if (nextStep === step) return;
  clearStepTransientState();
  step = nextStep;
  render();
}

function goNext() {
  if (step === 1 && !canStepOneContinue()) return;
  if (step === 2 && !canStepTwoContinue()) return;
  if (step === 3 && !canStepThreeContinue()) return;
  if (step === 3 && latestResult?.ok) saveRecent(latestResult, false);
  const nextStep = Math.min(4, step + 1);
  if (nextStep === step) return;
  clearStepTransientState();
  step = nextStep;
  render();
}

function clearStepTransientState() {
  selectedTile = null;
  selectedCandidate = null;
  picker = null;
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
  return isHandComplete() && Boolean(state.winTile) && handContextErrors().length === 0;
}

function canStepThreeContinue() {
  return doraValidationErrors().length === 0 && !needsLastKanClosedQuestion();
}

function handErrors() {
  const messages = handStructureWarnings();
  if (!state.melds.length) messages.push("손패 미완성: 세트를 입력해주세요.");
  else if (!isHandComplete()) messages.push("손패 미완성 또는 화료 형태 불가: 4몸통+1머리 또는 치또이 형태가 필요합니다.");
  messages.push(...handContextErrors());
  if (isHandComplete() && !state.winTile) messages.push(WIN_TILE_REQUIRED_TEXT);
  return messages;
}

function visibleHandErrors() {
  const structureWarnings = handStructureWarnings();
  if (structureWarnings.length) return structureWarnings;
  if (!state.melds.length) return [];
  if (!isHandComplete() && flattenMelds(state.melds).length < 14) return [];
  const errors = handErrors().filter((message) => message !== WIN_TILE_REQUIRED_TEXT);
  return errors;
}

function handContextErrors() {
  return handContextErrorsFor(state);
}

function handContextErrorsFor(targetState) {
  const messages = [];
  if (isHandComplete(targetState.melds) && targetState.situation.rinshan && !quads(targetState.melds).length) {
    messages.push("영상개화는 손패에 깡쯔가 있어야 합니다.");
  }
  if (isHandComplete(targetState.melds) && targetState.situation.chankan && !currentWinningTileCandidates(targetState.melds, targetState.situation).length) {
    messages.push("창깡은 슌쯔를 완성하는 화료만 가능합니다.");
  }
  if (
    isHandComplete(targetState.melds) &&
    targetState.situation.chankan &&
    targetState.winTile &&
    sameNormalizedTileCount(flattenMelds(targetState.melds), targetState.winTile) > 1
  ) {
    messages.push("창깡 화료패와 같은 패가 손패에 추가로 있으면 안 됩니다.");
  }
  return messages;
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
  messages.push(...handContextErrors());
  if (shouldAskLastKanWinQuestion() && state.lastKanWin === null) messages.push("마지막 깡 직후 질문에 응답해주세요.");
  if (state.lastKanWin === true && state.winMethod === "tsumo" && !state.situation.rinshan) messages.push("깡 직후 쯔모라면 영상개화를 선택해야 합니다.");
  if (state.situation.ippatsu && state.lastKanWin === true && !state.situation.chankan) messages.push("깡 직후 화료에서는 일발을 선택할 수 없습니다.");
  if (needsLastKanClosedQuestion()) messages.push("쯔모 직전 깡 종류를 선택해주세요.");
  const dora = normalizedSlots(state.doraIndicators);
  const doraCount = leadingCount(dora);
  const requiredDoraCount = requiredDoraIndicatorCount();
  if (!dora[0]) messages.push("도라 첫 칸을 입력해주세요.");
  if (doraCount < requiredDoraCount) {
    messages.push(`도라 표시패를 ${requiredDoraCount}개 이상 입력해주세요.`);
  }
  if (hasMiddleGap(dora)) messages.push("도라 중간 칸이 비어 있습니다.");
  if (state.situation.riichi || state.situation.doubleRiichi) {
    const ura = normalizedSlots(state.uraIndicators);
    if (hasMiddleGap(ura)) messages.push("우라도라 중간 칸이 비어 있습니다.");
    if (leadingCount(ura) !== leadingCount(dora)) messages.push("우라도라 개수가 도라 표시패 개수와 다릅니다.");
  }
  messages.push(...validateVisibleTiles([
    ...flattenMelds(state.melds),
    ...dora.filter(Boolean),
    ...((state.situation.riichi || state.situation.doubleRiichi) ? normalizedSlots(state.uraIndicators).filter(Boolean) : []),
  ]));
  if (state.situation.chankan && state.winTile) {
    const chankanVisibleTiles = [
      ...flattenMelds(state.melds),
      ...dora.filter(Boolean),
      ...((state.situation.riichi || state.situation.doubleRiichi) ? normalizedSlots(state.uraIndicators).filter(Boolean) : []),
    ];
    const message = "창깡 화료패와 같은 패가 손패/표시패에 추가로 있으면 안 됩니다.";
    if (sameNormalizedTileCount(chankanVisibleTiles, state.winTile) > 1 && !messages.includes(message)) messages.push(message);
  }
  return messages;
}

function sameNormalizedTileCount(tiles, targetTile) {
  const target = normalizeTile(targetTile);
  return tiles.filter((tile) => normalizeTile(tile) === target).length;
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
  modalReturnFocus = null;
  initialShareError = null;
  lastSavedRecentKey = null;
  location.hash = "";
  render();
}

function tileAssetSrc(tile) {
  return `${TILE_ASSET_ROOT}/${TILE_ASSET_FILES[tile]}`;
}

function quads(melds = state.melds) {
  return melds.filter((meld) => meld.kind === "quad");
}

function currentWinningTileCandidates(melds = state.melds, situation = state.situation) {
  return winningTileCandidates(melds, { chankan: situation.chankan });
}

function needsLastKanClosedQuestion() {
  return shouldAskLastKanClosedQuestion() && state.lastKanClosed === null;
}

function shouldAskLastKanWinQuestion() {
  return !state.situation.chankan && !state.situation.rinshan;
}

function shouldAskLastKanClosedQuestion() {
  return state.lastKanWin === true && state.situation.rinshan && quads().length > 0 && inferLastKanClosedFromMelds() === null;
}

function inferLastKanClosedFromMelds(melds = state.melds) {
  const handQuads = (melds || []).filter((meld) => meld.kind === "quad");
  if (!handQuads.length) return null;
  const hasOpen = handQuads.some((meld) => meld.open);
  const hasClosed = handQuads.some((meld) => !meld.open);
  if (hasOpen && hasClosed) return null;
  return hasClosed;
}

function resolvedLastKanClosed() {
  return inferLastKanClosedFromMelds() ?? state.lastKanClosed;
}

function requiredDoraIndicatorCount() {
  let recognizedKanDora = quads().length;
  const lastKanClosed = resolvedLastKanClosed();
  if (state.situation.rinshan && lastKanClosed !== true) recognizedKanDora -= 1;
  if (!state.situation.rinshan && !state.situation.chankan && state.winMethod === "ron" && state.lastKanWin === true) recognizedKanDora += 1;
  return 1 + Math.max(0, recognizedKanDora);
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
  const itemKey = encodeShareState(item.state);
  const recent = readRecent().filter((entry) => encodeShareState(entry.state) !== itemKey);
  recent.unshift(item);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)));
  } catch {
    // Private modes, storage quotas, or browser policies can reject localStorage writes.
  }
  if (rerender) render();
}

function recentLabel(result, sourceState) {
  return `${result.score.dealer ? "오야" : "자"} ${sourceState.winMethod === "ron" ? "론" : "쯔모"} ${totalScoreDisplay(result.score)} / ${scoreDetailLabel(result)}`;
}

function recentItemLabel(item) {
  const recentState = normalizeUiState(item.state);
  const result = calculate(recentState);
  return result.ok ? recentLabel(result, recentState) : item.label;
}

function readRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY) || "[]";
    if (raw.length > RECENT_STORAGE_MAX_LENGTH) return [];
    const parsed = JSON.parse(raw);
    return sanitizeRecentItems(parsed);
  } catch {
    return [];
  }
}

function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Keep the UI usable even when storage is unavailable.
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
  openModal("recent", () => document.querySelector(".recent-button"));
}

function openAlternatives(alternatives) {
  openModal({ type: "alternatives", alternatives }, () => findButtonByText("동점 해석 보기"));
}

function shareCurrentState() {
  rememberModalReturnFocus(() => findButtonByText("공유"));
  const encoded = encodeShareState(state);
  const url = `${location.origin}${location.pathname}#s=${encoded}`;
  history.replaceState(null, "", `${location.pathname}#s=${encoded}`);
  modal = { type: "share", url, copied: false };
  render();
  window.setTimeout(() => {
    navigator.clipboard?.writeText(url).then(() => {
      if (modal?.type === "share" && modal.url === url && !modal.copied) {
        modal = { type: "share", url, copied: true };
        render({ preserveModalFocus: true });
      }
    }).catch(() => {
      // Clipboard is optional; the visible URL box remains the fallback.
    });
  }, 0);
}

function openModal(nextModal, fallbackTarget = null) {
  rememberModalReturnFocus(fallbackTarget);
  modal = nextModal;
  render();
}

function rememberModalReturnFocus(fallbackTarget = null) {
  modalReturnFocus = {
    element: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    fallbackTarget,
  };
}

function restoreModalFocus() {
  const returnFocus = modalReturnFocus;
  modalReturnFocus = null;
  if (!returnFocus) return;
  requestAnimationFrame(() => {
    const target = returnFocus.element?.isConnected
      ? returnFocus.element
      : typeof returnFocus.fallbackTarget === "function"
        ? returnFocus.fallbackTarget()
        : null;
    target?.focus?.();
  });
}

function modalFocusSnapshot() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !active.closest(".sheet")) return null;
  return {
    tagName: active.tagName,
    ariaLabel: active.getAttribute("aria-label"),
    className: String(active.className || ""),
    text: active.textContent?.trim() || "",
  };
}

function restoreModalFocusSnapshot(snapshot) {
  if (!snapshot || !modal) return false;
  const sheet = document.querySelector(".sheet");
  const target = focusableModalElements(sheet).find((node) =>
    node.tagName === snapshot.tagName &&
    node.getAttribute("aria-label") === snapshot.ariaLabel &&
    String(node.className || "") === snapshot.className &&
    (node.textContent?.trim() || "") === snapshot.text
  );
  target?.focus?.();
  return Boolean(target);
}

function findButtonByText(text) {
  return [...document.querySelectorAll("button")].find((buttonNode) => buttonNode.textContent.trim() === text) || null;
}

function renderModal() {
  document.querySelectorAll(".modal-backdrop").forEach((node) => node.remove());
  if (!modal) return [];
  const close = () => {
    modal = null;
    render();
    restoreModalFocus();
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
      recent.length ? el("button", { className: "secondary-action recent-clear", text: "전체 삭제", onClick: () => { clearRecent(); render(); } }) : null,
    ];
  } else if (modal?.type === "alternatives") {
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "동점 해석" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      el("p", { className: "panel-note", text: "현재 결과와 총점/판수가 같은 다른 자동분해 후보입니다. 점수는 바뀌지 않고, 아래 역 구성이 후보별 차이입니다." }),
      el("div", { className: "recent-list" }, modal.alternatives.map((item, index) =>
        el("div", { className: "recent-item alternative-item" }, [
          el("strong", { text: `후보 ${index + 1} · ${totalScoreDisplay(item.score)} / ${scoreDetailLabel(item)} `, ariaLabel: `후보 ${index + 1} ${totalScoreDisplay(item.score)} ${scoreDetailLabel(item)}` }),
          el("span", { className: "alternative-yaku", text: yakuSummary(item.yaku) }),
        ]),
      )),
    ];
  } else if (modal?.type === "fu-details") {
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "커쯔/깡쯔 세부" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      el("div", { className: "result-lines" }, modal.lines.map((line) => pairRow("result-line", line.name, `+${line.fu}`))),
    ];
  } else if (modal?.type === "restore-error") {
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "복원 실패" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      el("p", { className: "panel-note", text: "저장된 최근계산을 복원하지 못했습니다." }),
    ];
  } else {
    body = [
      el("div", { className: "sheet-header" }, [
        el("h2", { text: "공유 링크" }),
        el("button", { className: "icon-button", text: "닫기", onClick: close }),
      ]),
      el("p", { className: "panel-note", text: modal.copied ? "클립보드에 복사했습니다." : "자동 복사가 되지 않으면 아래 링크를 직접 복사하세요." }),
      el("textarea", { className: "copy-box", value: modal.url, readOnly: true, ariaLabel: "공유 링크" }),
    ];
  }
  return [
    el("section", { className: "modal-backdrop", onClick: close }, [
      el("div", {
        className: "sheet",
        onClick: (event) => event.stopPropagation(),
        onKeydown: (event) => trapModalFocus(event, close),
        attrs: { role: "dialog", "aria-modal": "true", "aria-label": modalLabel(), tabindex: "-1" },
      }, body),
    ]),
  ];
}

function modalLabel() {
  if (modal === "recent") return "최근계산";
  if (modal?.type === "alternatives") return "동점 해석";
  if (modal?.type === "fu-details") return "커쯔/깡쯔 세부";
  if (modal?.type === "restore-error") return "복원 실패";
  return "공유 링크";
}

function focusModal() {
  if (!modal) return;
  requestAnimationFrame(() => {
    const sheet = document.querySelector(".sheet");
    const [first] = focusableModalElements(sheet);
    (first || sheet)?.focus();
  });
}

function trapModalFocus(event, close) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = focusableModalElements(event.currentTarget);
  if (!focusable.length) {
    event.preventDefault();
    event.currentTarget.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function focusableModalElements(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll("button, textarea, input, select, a[href], [tabindex]:not([tabindex='-1'])"))
    .filter((node) => !node.disabled && node.getAttribute("aria-hidden") !== "true");
}

function restoreRecent(item) {
  const [safeItem] = sanitizeRecentItems([item]);
  if (!safeItem) {
    modal = { type: "restore-error" };
    render();
    return;
  }
  applyRestoredState(normalizeUiState(safeItem.state), { stepOverride: 4, syncHash: true });
}

function applyRestoredState(nextState, { stepOverride = null, syncHash = false } = {}) {
  initialShareError = null;
  state = nextState;
  step = stepOverride ?? stepForLoadedState(state);
  selectedTile = null;
  selectedCandidate = null;
  picker = null;
  modal = null;
  modalReturnFocus = null;
  lastSavedRecentKey = null;
  if (syncHash) history.replaceState(null, "", `${location.pathname}#s=${encodeShareState(state)}`);
  render();
}
