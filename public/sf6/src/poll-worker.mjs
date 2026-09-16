/**
 * High-rate timer running in a Web Worker.
 *
 * The HTML spec clamps setTimeout/setInterval to a 4ms minimum once nesting
 * depth exceeds 5 — which is why a page-thread timer tops out near 230Hz no
 * matter whether you request 0, 1 or 4ms. That clamp applies per browsing
 * context, so a worker gets its own budget and can tick faster.
 *
 * The worker cannot call navigator.getGamepads() — the Gamepad API is not
 * exposed to workers — so this posts a tick to the page, which does the read.
 * That still helps: the expensive part is the timer cadence, not the read.
 */

let timer = null;
let ticks = 0;

self.onmessage = (e) => {
  const { type, intervalMs } = e.data ?? {};

  if (type === "start") {
    if (timer !== null) clearInterval(timer);
    ticks = 0;
    // A tight loop of setTimeout(0) inside a worker is not subject to the
    // page's nesting clamp in the same way; setInterval with a sub-ms request
    // is the simplest form that browsers honour more closely here.
    timer = setInterval(() => {
      ticks++;
      self.postMessage({ type: "tick", at: performance.now(), ticks });
    }, intervalMs ?? 0);
  }

  if (type === "stop") {
    if (timer !== null) clearInterval(timer);
    timer = null;
    self.postMessage({ type: "stopped", ticks });
  }
};
