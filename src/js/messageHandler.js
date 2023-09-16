export function defaultMessageHandler(request, sender) {
  switch (request.cmd) {
    case 'sendTo':
      chrome.tabs.sendMessage(Number(request.to), { ...request.request });
      break;
    case 'broadcast':
      chrome.tabs.query({}, (tabs) =>
        tabs.forEach((tab) => {
          console.log('tab', tab);
          chrome.tabs.sendMessage(tab.id, { ...request.request });
        })
      );
      break;
    case 'openTab':
      openTab(request);
      break;
    case 'openFocusedTab':
      openTab({ ...request, active: true });
      break;
    case 'openInSameTab':
      openInSameTab(request);
      break;
    case 'openInSameishTab':
      openInSameishTab(request, sender);
      break;
    case 'closeTabs':
      for (const tabId of request.tabIds) {
        removeTab(tabId);
      }
      break;
    case 'closeOtherTabs':
      closeOtherTabs(sender);
      break;
    case 'closeOtherNormalTabs':
      closeOtherNormalTabs(sender);
      break;
    case 'closeMyOpenedTabs':
      closeMyOpenedTabs(sender.tab.id);
      break;
    case 'closeNewerNormalTabs':
      closeNewerNormalTabs(sender);
      break;
    case 'closeMySelf':
      closeMySelf(sender);
      break;
    case 'closeTabsButOne':
      closeTabsButOne(sender.tab.id, request.url);
      break;
    case 'closeTabsButOneMinimizeWindow':
      closeTabsButOneMinimizeWindow(sender.tab.id, request.url);
      break;
    case 'minimize':
      minimizeCurrentWindow();
      break;
    case 'minimizeWindow':
      minimizeCurrentWindow();
      break;
    case 'closeWindow':
      closeWindow();
      break;
    case 'focusTab':
      focusTab(request.id);
      break;
    case 'focusMyTab':
      focusMyTab(sender);
      break;
    case 'unfocusMyTab':
      unfocusMyTab(sender);
      break;
    case 'getMyTabId':
      return { ok: true, response: sender.tab.id };
    case 'openOptionsPage':
      openOptionsPage();
      break;
    default:
      console.log('No hit in default messageHandler!');
      return false;
  }
  // If getting here, we have handled it!
  return { ok: true };
}

// WORKER FUNCS -------------------------------------------------------------------

export async function tabExists(tabId) {
  try {
    await chrome.tabs.get(tabId);
    return true;
  } catch (e) {
    return false;
  }
}

export async function removeTab(tabId) {
  console.log('removeTab, tabId:', tabId);
  try {
    if (!(await tabExists(tabId))) {
      console.log('Skip already closed tab:', tabId);
      return;
    }
    const tab = await chrome.tabs.get(parseInt(tabId));
    if (tab) {
      console.log('remove tab...', tab);
      chrome.tabs.remove(tabId, () => console.log(`close tab ${tabId}`));
    } else {
      console.log(`skip close tab ${tabId}`);
    }
  } catch (e) {
    console.log('removeTab error:', tabId, e.message);
  }
}

export async function getTabsToRight(sender) {
  console.log('getTabsToRight');
  chrome.tabs.query({}, (tabs) => {
    console.log('tabs:', tabs);
    const tabsResult = [];
    for (let tab of tabs) {
      if (tab.index > sender.tab.index) {
        console.log('tab is RIGHT:', tab);
        tabsResult.push(tab);
      } else {
        console.log('tab is left:', tab);
      }
    }
    console.log('tabsResult:', tabsResult);
    return tabsResult;
  });
}

function openTab(request) {
  chrome.tabs.create({ url: request.url, active: request.active ?? false });
}

function openInSameTab(request) {
  chrome.tabs.update(undefined, { url: request.url });
}

function openInSameishTab(request, sender) {
  console.log('sender.tab', sender.tab);
  if (sender.tab.url.startsWith('http')) {
    chrome.tabs.update(undefined, { url: request.url });
  } else {
    chrome.tabs.create({ url: request.url });
  }
}

function closeOtherTabs(sender) {
  closeOtherTabsGeneric(sender.tab, false, false);
}

function closeOtherNormalTabs(sender) {
  closeOtherTabsGeneric(sender.tab, false, true);
}

function closeNewerNormalTabs(sender) {
  closeOtherTabsGeneric(sender.tab, true, true);
}

function closeMySelf(sender) {
  chrome.tabs.remove(sender.tab.id, () => console.log('close tab'));
}

function focusMyTab(sender) {
  chrome.tabs.update(sender.tab.id, { highlighted: true });
}

function focusTab(id) {
  chrome.tabs.update(id, { highlighted: true });
}

function unfocusMyTab(sender) {
  unfocusMyTabId(sender.tab.id);
}

function unfocusMyTabId(tabId) {
  chrome.tabs.update(tabId, { highlighted: false, active: false });
}

function openOptionsPage() {
  console.log('openOptionsPage');
  chrome.runtime.openOptionsPage();
}

function closeOtherTabsGeneric(myTab, onlyNewer = false, onlyNormal = true, exceptionTabIds = []) {
  console.log('closeOtherTabs; myTab, onlyNewer, onlyNormal, exceptionTabIds', myTab, onlyNewer, onlyNormal, exceptionTabIds);
  chrome.tabs.query({}, (tabs) => {
    console.log('tabs', tabs);
    tabs.forEach((tab) => {
      console.log('tab', tab);
      let shouldClose = false;
      if (onlyNewer) {
        shouldClose = tab.id > myTab.id && (onlyNormal ? tab.url.startsWith('http') : true);
      } else {
        shouldClose = tab.id !== myTab.id && (onlyNormal ? tab.url.startsWith('http') : true);
      }
      if (exceptionTabIds.includes(tab.id)) {
        shouldClose = false;
      }
      console.log('shouldClose:', shouldClose);
      if (shouldClose) {
        console.log('Close this tab:', tab);
        chrome.tabs.remove(tab.id, () => console.log('close tab'));
      }
    });
  });
}

function closeMyOpenedTabs(myTabId) {
  console.log('closeMyOpenedTabs; myTabId:', myTabId);
  chrome.tabs.query({}, (tabs) => {
    console.log('closeMyOpenedTabs tabs', tabs);
    tabs.forEach((tab) => {
      console.log('tab', tab);
      const shouldClose = tab.openerTabId && tab.openerTabId === myTabId;
      console.log('shouldClose:', shouldClose);
      if (shouldClose) {
        console.log('Close this tab:', tab);
        if (tab) {
          chrome.tabs.remove(tab.id, () => console.log('close tab'));
        }
      }
    });
  });
}

function closeTabsButOne(senderTabId, url) {
  const butOneTabUrl = url || 'chrome://version/';
  chrome.tabs.update(senderTabId, { url: butOneTabUrl });
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      console.log('tab', tab);
      if (senderTabId === tab.id) {
        return;
      }
      chrome.tabs.remove(tab.id, () => console.log(`Close tab: ${tab.url}`));
    });
  });
  return true;
}

function closeTabsButOneMinimizeWindow(senderTabId, url) {
  closeTabsButOne(senderTabId, url);
  minimizeCurrentWindow();
  return true;
}

function closeWindow() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.remove(tab.id, () => console.log(`Close tab: ${tab.url}`));
    });
  });
  return true;
}

function minimizeCurrentWindow() {
  chrome.windows.getCurrent((win) => {
    console.log(win);
    chrome.windows.update(win.id, { state: 'minimized' });
  });
}
