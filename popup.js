export async function getGroupTabs(chromeApi = chrome) {
  const [activeTab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
  if (!activeTab || activeTab.groupId === -1) return [];
  return chromeApi.tabs.query({ groupId: activeTab.groupId });
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

export async function setupPopup({
  chromeApi = chrome,
  clipboard = navigator.clipboard,
  documentApi = document
} = {}) {
  const reloadButton = documentApi.getElementById("reload");
  const copyButton = documentApi.getElementById("copy");
  const exportButton = documentApi.getElementById("export");
  const status = documentApi.getElementById("status");
  const tabs = await getGroupTabs(chromeApi);

  for (const button of [reloadButton, copyButton, exportButton]) {
    button.disabled = tabs.length === 0;
  }
  status.textContent = tabs.length
    ? `${tabs.length} tabs in this group`
    : "This tab is not in a group";

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
