(function () {
  const endpoint = "https://blog.sayori.org/api/analytics/event";
  const site = "home";
  const heartbeatMs = 30000;
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
