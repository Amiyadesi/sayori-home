// Run with the two preview servers: playwright-cli run-code --filename=scripts/unsaved.browser.js
async (previewPage) => {
  const context = await previewPage
    .context()
    .browser()
    .newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  const remote = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:"))
      remote.push(request.url());
  });
  const check = (condition, label) => {
    if (!condition) throw new Error(label);
  };
  const home = "http://127.0.0.1:4322";
  const blog = "http://127.0.0.1:4321";
  const save = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("amiya.unsaved.v1")));
  const tokenFor = (value) =>
    page.evaluate(
      (state) =>
        btoa(JSON.stringify(state))
          .replaceAll("+", "-")
          .replaceAll("/", "_")
          .replaceAll("=", ""),
      value,
    );
  const go = async (route) => {
    await page.locator(`main [data-route="${route}"]`).first().click();
    await page.waitForFunction(
      () => document.querySelector("#journal-open") && !location.hash,
    );
  };
  const moves = async (list) => {
    for (const direction of list)
      await page.locator(`[data-move="${direction}"]`).click();
  };
  const first = [
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
  ];
  const final = [...Array(6).fill("right"), "down", "down", "left", "down"];
  const journal = async () => {
    await page.locator("#journal-open").click();
    await page.locator("#journal-dialog summary").first().click();
  };
  try {
    await page.goto(`${home}/unsaved/end/`);
    check(
      await page.locator(".blocked").isVisible(),
      "Fresh direct late route must be gated",
    );
    await page.goto(`${blog}/unsaved/`);
    await page.locator("#begin").click();
    const early = await save();
    await go("about");
    check(page.url().startsWith(home + "/"), "Real origin transition");
    for (const id of ["builder", "collector", "observer"])
      await page.locator(`[data-profile="${id}"]`).click();
    check((await save()).id === early.id, "Cross-site run identity retained");
    await go("first");
    await page.locator("#board").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("z");
    check(
      (await page.locator('[aria-label="2 行 2 列：你"]').count()) === 1,
      "Keyboard and undo",
    );
    await page.reload();
    await moves(first);
    check(
      (await save()).flags.includes("first"),
      "First board completed through controls",
    );
    await page.screenshot({
      path: "output/playwright/unsaved-first-complete.png",
      fullPage: true,
    });
    await go("margins");
    check(
      page.url().startsWith(blog + "/"),
      "Back to blog with completed board",
    );
    const answers = {
      reason: ["coexist", "speech"],
      value: ["open", "unknown"],
      detour: ["return", "toy"],
    };
    for (const [id, [annotation, proof]] of Object.entries(answers)) {
      const form = page.locator(`[data-margin="${id}"]`);
      await form.locator(`input[value="${annotation}"]`).check();
      await form.locator("select").selectOption(proof);
      await form.locator("button").click();
    }
    check((await save()).flags.includes("margins"), "All annotations retained");
    await go("links");
    for (const [from, to] of [
      ["game", "ai"],
      ["ai", "community"],
      ["community", "server"],
      ["server", "web"],
      ["web", "toy"],
    ]) {
      await page.locator(`[data-node="${from}"]`).click();
      await page.locator(`[data-node="${to}"]`).click();
    }
    check(
      (await save()).flags.includes("network"),
      "Evidence connections complete",
    );
    await go("jam");
    await page.locator("#test-build").click();
    await moves(["right", "right", "right"]);
    check(
      (await page.locator("#board-status").textContent()).includes("少一座桥"),
      "Missing bridge actually blocks",
    );
    await page.locator('input[value="boss"]').uncheck();
    await page.locator('input[value="bridge"]').check();
    await page.locator("#test-build").click();
    await moves(Array(6).fill("right"));
    check(
      (await page.locator("#board-status").textContent()).includes("结束条件"),
      "Missing goal actually blocks",
    );
    await page.locator('input[value="goal"]').check();
    await page.locator('input[value="undo"]').check();
    await page.locator("#test-build").click();
    await moves(Array(6).fill("right"));
    check((await save()).flags.includes("jam"), "Jam edited and played");
    await page.screenshot({
      path: "output/playwright/unsaved-jam-desktop.png",
      fullPage: true,
    });
    await go("shelf");
    for (const [name, value] of [
      ["builder", "first"],
      ["collector", "edit"],
      ["observer", "connections"],
    ]) {
      await page.locator(`select[name="${name}"]`).selectOption(value);
    }
    await page.locator("#evidence-form button").click();
    check((await save()).flags.includes("shelf"), "Evidence response");
    await go("end");
    for (const [items, ending] of [
      [["flag", "tool"], "make"],
      [["flag", "margin"], "share"],
      [["tool", "margin"], "space"],
    ]) {
      for (const input of await page.locator("input[name=souvenir]").all())
        await input.uncheck();
      for (const item of items)
        await page.locator(`input[value="${item}"]`).check();
      await page.locator("#start-ending").click();
      await moves(final);
      check(
        await page.locator(`[data-ending="${ending}"]`).isVisible(),
        `Epilogue ${ending}`,
      );
      if (ending !== "space") await page.locator("#choose-again").click();
    }
    let downloadPromise = page.waitForEvent("download");
    await page.locator("#download-keepsake").click();
    const keepsake = await downloadPromise;
    check((await keepsake.failure()) === null, "Keepsake download");
    await keepsake.saveAs("output/playwright/unsaved-keepsake.txt");
    const completed = await save();
    await page.goto(`${home}/unsaved/room/`);
    for (const note of ["0", "1", "2", "3"])
      await page.locator(`[data-note="${note}"]`).click();
    check((await save()).flags.includes("room"), "Optional room works muted");
    await page.locator("#sound-toggle").click();
    check(
      (await page.locator("#sound-toggle").getAttribute("aria-pressed")) ===
        "true",
      "Audio opt-in",
    );
    await page.locator('[data-note="4"]').click();
    await page.locator("#sound-toggle").click();
    const latest = await save();
    const earlyToken = await tokenFor(early);
    await page.goto(`${home}/unsaved/#u=${earlyToken}`);
    await page.waitForFunction(() => !location.hash);
    check(
      (await save()).endings.length === 3 &&
        (await save()).flags.includes("room"),
      "Old token cannot roll back",
    );
    await page.goto(`${home}/unsaved/#u=broken!`);
    await page.waitForFunction(() => !location.hash);
    check(
      (await page.locator("#notice").textContent()).includes("未导入"),
      "Bad URL token visible failure",
    );
    check((await save()).id === latest.id, "Bad token preserves save");
    await journal();
    await page.locator("#save-code").fill("invalid!");
    await page.locator("#import-code").click();
    check(
      (await page.locator("#save-status").textContent()).includes("没有导入"),
      "Bad code rejected",
    );
    downloadPromise = page.waitForEvent("download");
    await page.locator("#export-save").click();
    const exported = await downloadPromise;
    await exported.saveAs("output/playwright/unsaved-save.json");
    await page
      .locator("#save-file")
      .setInputFiles("output/playwright/unsaved-bad.json");
    await page.waitForFunction(() =>
      document.querySelector("#save-status").textContent.includes("没有导入"),
    );
    check(
      (await page.locator("#save-status").textContent()).includes("没有导入"),
      "Bad file rejected",
    );
    const other = { ...early, id: "different-test-run" };
    await page.locator("#save-code").fill(await tokenFor(other));
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.locator("#import-code").click();
    check(
      (await save()).id === latest.id,
      "Other run cancel preserves progress",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("#import-code").click();
    await page.waitForURL(`${home}/unsaved/`);
    check((await save()).id === other.id, "Explicit other-run switch");
    await journal();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .locator("#save-file")
      .setInputFiles("output/playwright/unsaved-save.json");
    await page.waitForURL(`${home}/unsaved/end/`);
    check((await save()).endings.length === 3, "JSON file restore");
    const peer = await context.newPage();
    await peer.goto(`${home}/unsaved/`);
    await page.locator("#hint-open").click();
    await page.locator("#more-hint").click();
    await peer.waitForFunction(
      () =>
        document.querySelector("#save-code").value &&
        JSON.parse(
          atob(
            document
              .querySelector("#save-code")
              .value.replaceAll("-", "+")
              .replaceAll("_", "/"),
          ),
        ).hints.end === 1,
    );
    await page.locator("#hint-dialog [data-close]").click();
    // Both writes deliberately use stale snapshots, reproducing a same-origin tab race.
    await Promise.all([
      peer.evaluate(
        (value) =>
          localStorage.setItem("amiya.unsaved.v1", JSON.stringify(value)),
        { ...latest, hints: { intro: 1 } },
      ),
      page.evaluate(
        (value) =>
          localStorage.setItem("amiya.unsaved.v1", JSON.stringify(value)),
        { ...latest, hints: { about: 1 } },
      ),
    ]);
    await page.waitForFunction(() => {
      const data = JSON.parse(localStorage.getItem("amiya.unsaved.v1"));
      return data.hints.intro === 1 && data.hints.about === 1;
    });
    await peer.close();
    await page.reload();
    check(
      (await save()).hints.about === 1 && (await save()).hints.intro === 1,
      "Racing saves persist their union",
    );
    await page.goBack();
    await page.goForward();
    check(
      (await save()).flags.includes("finish"),
      "Back/forward retains checkpoint",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const [origin, path] of [
        [blog, ""],
        [home, ""],
        [home, "first/"],
        [blog, "margins/"],
        [home, "links/"],
        [home, "jam/"],
        [blog, "shelf/"],
        [home, "end/"],
        [home, "room/"],
      ]) {
        const token = await tokenFor(latest);
        await page.goto(`${origin}/unsaved/${path}#u=${token}`);
        await page.waitForFunction(() => !location.hash);
        const size = await page.evaluate(() => ({
          width: innerWidth,
          content: document.documentElement.scrollWidth,
        }));
        check(
          size.content <= size.width,
          `Horizontal overflow ${width}px ${origin}/${path}: ${size.content}`,
        );
        if (width === 390 && path === "first/")
          await page.screenshot({
            path: "output/playwright/unsaved-first-mobile.png",
            fullPage: true,
          });
        if (width === 320 && path === "end/") {
          await page.locator('input[value="flag"]').check();
          await page.locator('input[value="tool"]').check();
          await page.locator("#start-ending").click();
          await page
            .locator("#final-game")
            .screenshot({ path: "output/playwright/unsaved-end-mobile.png" });
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${blog}/unsaved/`);
    await page.screenshot({
      path: "output/playwright/unsaved-entry-desktop.png",
      fullPage: true,
    });
    await journal();
    await page.locator("#journal-dialog summary").nth(1).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("#reset-save").click();
    await page.waitForFunction(
      () =>
        !location.hash &&
        JSON.parse(localStorage.getItem("amiya.unsaved.v1")).flags.length === 0,
    );
    check((await save()).id !== latest.id, "Reset has new run identity");
    const limited = await previewPage.context().browser().newContext();
    await limited.addInitScript(() =>
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("Storage disabled", "SecurityError");
        },
      }),
    );
    const noStore = await limited.newPage();
    await noStore.goto(`${blog}/unsaved/`);
    check(
      (await noStore.locator("#notice").textContent()).includes("无法读取"),
      "Blocked storage warning",
    );
    await noStore.locator("#begin").click();
    await noStore.locator('main [data-route="about"]').click();
    for (const id of ["builder", "collector", "observer"])
      await noStore.locator(`[data-profile="${id}"]`).click();
    check(
      await noStore.locator('[data-unlock="profiles"]').isVisible(),
      "In-memory cross-origin play despite blocked storage",
    );
    await limited.close();
    check(errors.length === 0, errors.join("\n"));
    check(remote.length === 0, `Unexpected network: ${remote.join(", ")}`);
    return {
      result:
        "PASS: main route, three endings, side room, save/import/conflict/reset, old token, keyboard, 320/390px, storage blocked",
      endings: completed.endings,
      errors,
      remote,
    };
  } finally {
    await context.close();
  }
}
