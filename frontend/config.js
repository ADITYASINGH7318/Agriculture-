/* Set this to your deployed backend URL, without a trailing slash.
   Example: window.AGROPILOT_API_BASE = "https://your-backend.example.com";
   Leave blank only when frontend and backend share the same origin. */
window.AGROPILOT_API_BASE = "https://YOUR-BACKEND-URL";
(function () {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const base = String(window.AGROPILOT_API_BASE || "").replace(/\/$/, "");
    if (typeof input === "string" && base && (input.startsWith("/api/") || input.startsWith("/uploads/"))) {
      input = base + input;
    }
    return nativeFetch(input, init);
  };
})();
