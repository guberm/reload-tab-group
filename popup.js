export async function getGroupTabs(chromeApi = chrome) {
  const windowTabs = await chromeApi.tabs.query({ currentWindow: true });
  const activeTab = windowTabs.find((tab) => tab.active);
  if (!activeTab || activeTab.groupId === -1) return [];
  return windowTabs.filter((tab) => tab.groupId === activeTab.groupId);
}

const urlsFrom = (tabs) => tabs.map((tab) => tab.url || tab.pendingUrl).filter(Boolean);

export async function reloadGroup(chromeApi = chrome) {
  const tabs = await getGroupTabs(chromeApi);
  await Promise.all(tabs.map((tab) => chromeApi.tabs.reload(tab.id)));
  return tabs.length;
}

export async function copyGroupUrls(chromeApi = chrome, clipboard = navigator.clipboard) {
  const urls = urlsFrom(await getGroupTabs(chromeApi));
  if (!urls.length) return 0;
  await clipboard.writeText(urls.join("\n"));
  return urls.length;
}

export async function exportGroupUrls(chromeApi = chrome, documentApi = document) {
  const urls = urlsFrom(await getGroupTabs(chromeApi));
  if (!urls.length) return 0;
  const anchor = documentApi.createElement("a");
  anchor.href = `data:text/plain;charset=utf-8,${encodeURIComponent(`${urls.join("\n")}\n`)}`;
  anchor.download = "tab-group-urls.txt";
  anchor.click();
  return urls.length;
}

export function setupPopup({
  chromeApi = chrome,
  clipboard = navigator.clipboard,
  documentApi = document
} = {}) {
  const reloadButton = documentApi.getElementById("reload");
  const copyButton = documentApi.getElementById("copy");
  const exportButton = documentApi.getElementById("export");
  const status = documentApi.getElementById("status");

  const run = async (action, success, failure) => {
    try {
      status.textContent = success(await action());
    } catch {
      status.textContent = failure;
    }
  };

  reloadButton.addEventListener("click", () =>
    run(() => reloadGroup(chromeApi), (count) => `Reloaded ${count} tabs`, "Reload failed"));
  copyButton.addEventListener("click", () =>
    run(() => copyGroupUrls(chromeApi, clipboard), (count) => `Copied ${count} URLs`, "Copy failed"));
  exportButton.addEventListener("click", () =>
    run(() => exportGroupUrls(chromeApi, documentApi), (count) => `Exported ${count} URLs`, "Export failed"));
}

if (typeof document !== "undefined") setupPopup();
