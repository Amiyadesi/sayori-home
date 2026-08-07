(function () {
  "use strict";

  const ga4MeasurementId = "G-KV2MY3FGDK";
  let ga4Started = false;

  function runWhenIdle(callback, timeout = 2500) {
    let called = false;
    const run = () => {
      if (called) return;
      called = true;
      callback();
    };
    const start = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(run, { timeout });
      } else {
        run();
      }
    };
    window.setTimeout(start, Math.min(timeout, 1000));
  }

  function loadGoogleAnalytics() {
    if (ga4Started) return;
    ga4Started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", ga4MeasurementId);
    if (document.querySelector('script[data-sayori-ga4="true"]')) return;
    const script = document.createElement("script");
    script.async = true;
    script.dataset.sayoriGa4 = "true";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4MeasurementId)}`;
    document.head.appendChild(script);
  }

  runWhenIdle(loadGoogleAnalytics);
  window.addEventListener("pointerdown", loadGoogleAnalytics, { once: true, passive: true });
  window.addEventListener("keydown", loadGoogleAnalytics, { once: true, passive: true });

  const site = document.documentElement.dataset.sayoriAnalyticsSite;
  if (!site || document.documentElement.dataset.sayoriAnalyticsTracker === "active") {
    return;
  }
  document.documentElement.dataset.sayoriAnalyticsTracker = "active";
  const endpoint = "https://blog.sayori.org/api/analytics/event";
  const heartbeatMs = 60000;
  const storagePrefix = "sayoriHomeAnalytics";

  function randomId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  }

  function storedId(storage, key) {
    try {
      let value = storage.getItem(key);
      if (!value) {
        value = randomId();
        storage.setItem(key, value);
      }
      return value;
    } catch {
      return randomId();
    }
  }

  const visitorId = storedId(localStorage, storagePrefix + ":visitor");
  const sessionId = storedId(sessionStorage, storagePrefix + ":session");
  let lastPageKey = "";

  function payload(event) {
    return {
      event,
      site,
      visitorId,
      sessionId,
      path: window.location.pathname,
      title: document.title || "",
    };
  }

  function send(event) {
    const body = JSON.stringify(payload(event));
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      mode: "cors",
    }).catch(() => {});
  }

  function pageview() {
    const key = window.location.pathname + "|" + document.title;
    if (key === lastPageKey) return;
    lastPageKey = key;
    send("pageview");
  }

  function heartbeat() {
    if (document.visibilityState === "visible") {
      send("heartbeat");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pageview, { once: true });
  } else {
    pageview();
  }
  document.addEventListener("visibilitychange", heartbeat);
  window.setInterval(heartbeat, heartbeatMs);
})();
