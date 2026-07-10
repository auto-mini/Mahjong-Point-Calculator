import { expect, test } from "@playwright/test";

import { createStateFromMelds, encodeShareState } from "../../src/domain.js";

const LARGE_TOUCH_KEY = "riichi-fu-calculator-large-touch-v1";

const resultState = createStateFromMelds({
  winMethod: "ron",
  roundWind: "east",
  seatWind: "south",
  lastKanWin: false,
  situation: { none: false, riichi: true },
  melds: [
    { tiles: ["m1", "m1", "m1"] },
    { tiles: ["p2", "p3", "p4"] },
    { tiles: ["p5", "p6", "p7"] },
    { tiles: ["s2", "s3", "s4"] },
    { tiles: ["east", "east"] },
  ],
  winTile: "east",
  doraIndicators: ["m9"],
  uraIndicators: ["p9"],
});

const fixtures = {
  pageTwo: encodeShareState({
    ...resultState,
    winTile: null,
    doraIndicators: [],
    uraIndicators: [],
  }),
  pageThree: encodeShareState({
    ...resultState,
    doraIndicators: [],
    uraIndicators: [],
  }),
  pageFour: encodeShareState(resultState),
};

async function openPage(page, expectedTitle, shareState = null) {
  await page.goto(shareState ? `/#s=${shareState}` : "/");
  await expect(page.locator(".page-title h1")).toHaveText(expectedTitle);
  await page.evaluate(() => document.fonts.ready);
}

async function setLargeTouchMode(page, enabled) {
  const toggle = page.locator(".touch-toggle");
  const expected = String(enabled);
  if (await toggle.getAttribute("aria-pressed") !== expected) {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute("aria-pressed", expected);
  await expect(page.locator("#app")).toHaveClass(enabled ? /\blarge-touch\b/ : /^(?!.*\blarge-touch\b)/);
  const storedPreference = await page.evaluate((key) => localStorage.getItem(key), LARGE_TOUCH_KEY);
  if (enabled) expect(storedPreference).toBe("1");
  else expect([null, "0"]).toContain(storedPreference);
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const scrollingWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    );
    const selectors = [
      "#app",
      ".topbar",
      ".panel",
      ".footer",
      ".tile-grid",
      ".slot-row",
      ".result-card",
      ".sheet",
    ];
    const outsideViewport = [...document.querySelectorAll(selectors.join(","))]
      .filter((node) => {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const rect = node.getBoundingClientRect();
        return rect.left < -1 || rect.right > viewportWidth + 1;
      })
      .map((node) => ({
        className: node.className,
        left: Math.round(node.getBoundingClientRect().left * 10) / 10,
        right: Math.round(node.getBoundingClientRect().right * 10) / 10,
      }));
    return {
      viewportWidth,
      scrollingWidth,
      outsideViewport,
    };
  });

  expect(overflow.scrollingWidth, JSON.stringify(overflow, null, 2)).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  expect(overflow.outsideViewport, JSON.stringify(overflow, null, 2)).toEqual([]);
}

async function expectTouchTargets(page, largeTouch) {
  const undersized = await page.locator("button").evaluateAll((buttons, large) => buttons.flatMap((button) => {
    const style = getComputedStyle(button);
    const rect = button.getBoundingClientRect();
    if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) return [];
    const dense = button.matches(".tile-button, .meld-remove");
    const minimum = large ? (dense ? 40 : 42) : 24;
    if (rect.width + 0.5 >= minimum && rect.height + 0.5 >= minimum) return [];
    return [{
      name: button.getAttribute("aria-label") || button.textContent.trim(),
      className: button.className,
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
      minimum,
    }];
  }), largeTouch);

  expect(undersized, JSON.stringify(undersized, null, 2)).toEqual([]);
}

async function expectResponsivePage(page, largeTouch) {
  await expectNoHorizontalOverflow(page);
  await expectTouchTargets(page, largeTouch);
}

test("all four pages fit each mobile viewport in both button modes", async ({ page }) => {
  for (const largeTouch of [false, true]) {
    await openPage(page, "화료/국 정보");
    await setLargeTouchMode(page, largeTouch);
    await expectResponsivePage(page, largeTouch);

    await page.getByRole("button", { name: "주의사항" }).click();
    await expect(page.getByRole("dialog", { name: "주의사항" })).toBeVisible();
    await expectResponsivePage(page, largeTouch);
    await page.getByRole("button", { name: "닫기" }).click();
    await expect(page.getByRole("dialog", { name: "주의사항" })).toBeHidden();

    await openPage(page, "손패 입력", fixtures.pageTwo);
    await expectResponsivePage(page, largeTouch);
    await expect(page.locator(".meld-remove")).toHaveCount(5);
    await expect(page.getByRole("button", { name: "전체 초기화" })).toBeVisible();

    await openPage(page, "도라/우라", fixtures.pageThree);
    await expectResponsivePage(page, largeTouch);
    await page.getByRole("button", { name: "도라 표시패 1 선택", exact: true }).click();
    await expect(page.locator(".indicator-picker")).toBeVisible();
    await expectResponsivePage(page, largeTouch);
    await page.keyboard.press("Escape");
    await expect(page.locator(".indicator-picker")).toBeHidden();

    await openPage(page, "결과", fixtures.pageFour);
    await expectResponsivePage(page, largeTouch);
    await expect(page.locator(".result-card")).toContainText("8000점");
  }
});

test("selection keeps focus and page changes announce the new heading", async ({ page }) => {
  await openPage(page, "화료/국 정보");

  const ron = page.getByRole("button", { name: "론", exact: true });
  await ron.focus();
  await ron.press("Enter");
  await expect(ron).toHaveAttribute("aria-pressed", "true");
  await expect(ron).toBeFocused();

  const continueButton = page.getByRole("button", { name: "손패 입력으로" });
  await continueButton.focus();
  await continueButton.press("Enter");
  const handHeading = page.getByRole("heading", { level: 1, name: "손패 입력" });
  await expect(handHeading).toBeVisible();
  await expect(handHeading).toBeFocused();

  const back = page.getByRole("button", { name: "이전 페이지로" });
  await back.focus();
  await back.press("Enter");
  const firstHeading = page.getByRole("heading", { level: 1, name: "화료/국 정보" });
  await expect(firstHeading).toBeVisible();
  await expect(firstHeading).toBeFocused();
});

test("fu disclosure preserves focus and exposes its controlled details", async ({ page }) => {
  await openPage(page, "결과", fixtures.pageFour);

  const disclosure = page.locator("[data-focus-key='fu-meld-toggle']");
  await disclosure.focus();
  await disclosure.press("Enter");
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  await expect(disclosure).toBeFocused();
  await expect(page.locator("#fu-meld-details")).toContainText("1만 커쯔");

  await disclosure.press("Enter");
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await expect(disclosure).toBeFocused();
  await expect(page.locator("#fu-meld-details")).toHaveCount(0);
});

test("indicator picker and modal restore keyboard focus", async ({ page }) => {
  await openPage(page, "도라/우라", fixtures.pageThree);

  const firstDoraSlot = page.getByRole("button", { name: "도라 표시패 1 선택", exact: true });
  await firstDoraSlot.focus();
  await firstDoraSlot.press("Enter");
  const firstIndicator = page.locator(".indicator-picker .tile-button").first();
  await expect(firstIndicator).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".indicator-picker")).toHaveCount(0);
  await expect(firstDoraSlot).toBeFocused();

  await openPage(page, "화료/국 정보");
  const notice = page.getByRole("button", { name: "주의사항" });
  await notice.focus();
  await notice.press("Enter");
  const dialog = page.getByRole("dialog", { name: "주의사항" });
  const close = dialog.getByRole("button", { name: "닫기" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(notice).toBeFocused();
});
