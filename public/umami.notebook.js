(function () {
  const websiteId = "d0f1a30c-3eb2-4230-ad1f-aaedc8b1fa9d";
  const scriptSrc = "https://stats.sayori.org/script.js";
  const hostUrl = "https://stats.sayori.org";
  const domains = "sayori.org";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteId)) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = scriptSrc;
  script.dataset.websiteId = websiteId;
  script.dataset.hostUrl = hostUrl;
  script.dataset.domains = domains;
  document.head.appendChild(script);
})();
