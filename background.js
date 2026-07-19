const NO_GROUP = -1;

chrome.action.onClicked.addListener((activeTab) => {
  if (activeTab.groupId === NO_GROUP) {
    chrome.action.setBadgeBackgroundColor({ color: "#6B7280", tabId: activeTab.id });
    chrome.action.setBadgeText({ tabId: activeTab.id, text: "—" });
    chrome.action.setTitle({ tabId: activeTab.id, title: "This tab is not in a group" });
    return;
  }

  chrome.tabs.query({ groupId: activeTab.groupId }, (tabs) => {
    for (const tab of tabs) chrome.tabs.reload(tab.id);

    chrome.action.setBadgeBackgroundColor({ color: "#2563EB", tabId: activeTab.id });
    chrome.action.setBadgeText({ tabId: activeTab.id, text: String(tabs.length) });
    chrome.action.setTitle({
      tabId: activeTab.id,
      title: `Reloaded ${tabs.length} tabs`
    });
  });
});
