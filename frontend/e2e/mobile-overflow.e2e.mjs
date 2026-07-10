import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
const viewportWidth = Number(process.env.E2E_MOBILE_WIDTH ?? 360);
const viewportHeight = Number(process.env.E2E_MOBILE_HEIGHT ?? 800);

const routes = [
  "/",
  "/login",
  "/market",
  "/market/lojas",
  "/checkout",
  "/learning"
];

const allowedOverflowSelectors = [
  ".overflow-hidden",
  ".market-ecom-dept",
  ".market-flash-grid",
  ".market-directory-chips",
  ".checkout-progress-steps",
  ".learn-filters"
];

const browser = await chromium.launch({ headless: process.env.E2E_HEADLESS !== "false" });
const page = await browser.newPage({
  viewport: { width: viewportWidth, height: viewportHeight },
  deviceScaleFactor: 1,
  isMobile: true
});

page.setDefaultTimeout(Number(process.env.E2E_TIMEOUT_MS ?? 60_000));

const failures = [];

try {
  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "load" });
    await page.waitForTimeout(1_200);

    const result = await page.evaluate((allowedSelectors) => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
      const clientWidth = doc.clientWidth;
      const overflow = scrollWidth - clientWidth;

      const unexpectedOffenders = Array.from(document.body.querySelectorAll("*"))
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && (rect.right > window.innerWidth + 1 || rect.left < -1))
        .filter(({ element }) => !allowedSelectors.some((selector) => element.closest(selector)))
        .slice(0, 8)
        .map(({ element, rect }) => ({
          tag: element.tagName.toLowerCase(),
          className: String(element.className || "").slice(0, 140),
          text: String(element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        }));

      return { scrollWidth, clientWidth, overflow, unexpectedOffenders };
    }, allowedOverflowSelectors);

    console.log(`${route} overflow=${result.overflow}`);

    if (result.overflow > 1 || result.unexpectedOffenders.length > 0) {
      failures.push({ route, ...result });
    }
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
