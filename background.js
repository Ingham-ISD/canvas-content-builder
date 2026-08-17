chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // The organization-owned Apps Script proxy keeps the Airia key and pipeline
  // ID off teachers' devices. Credentials are included so a domain-restricted
  // web-app deployment can use the user's existing Google Workspace session.
  if (msg.type === "proxyRequest") {
    const { url, body } = msg;
    let target;
    try {
      target = new URL(url);
      if (target.protocol !== "https:" || !/\.google\.com$/i.test(target.hostname)) {
        throw new Error("Proxy URL must be an HTTPS Google Apps Script URL.");
      }
    } catch (err) {
      sendResponse({ error: `Invalid proxy URL: ${err.message}`, stage: "proxy_url" });
      return false;
    }

    fetch(target.toString(), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(async (resp) => {
        const text = await resp.text();
        if (!resp.ok) {
          sendResponse({ error: `Organization proxy error ${resp.status}.`, stage: "proxy_http" });
          return;
        }
        try {
          const payload = JSON.parse(text);
          if (payload.error) sendResponse({ error: payload.error, stage: payload.stage || "proxy" });
          else sendResponse({ data: payload.data || "" });
        } catch {
          sendResponse({ error: "Organization proxy returned invalid JSON.", stage: "proxy_parse" });
        }
      })
      .catch((err) => sendResponse({ error: `Organization proxy network error: ${err.message}`, stage: "proxy_network" }));

    return true;
  }

  return false;
});
