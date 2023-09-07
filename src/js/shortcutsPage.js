import { addPendingRequest } from '@ahstream/hx-lib';

// EXPORTED FUNCTIONS ---------------------------------------------------------------

export function initShortcutsPage() {
  console.log('initShortcutsPage');
}

export async function mountShortcutsPage(approvedUrls, data) {
  console.log('mountShortcutsPage:', approvedUrls, data);

  if (!data) {
    return;
  }

  const params = new URL(window.location.href).searchParams;
  console.info('params:', params);
  const cmd = params.get('cmd') || null;
  const url = params.get('url') || null;
  console.info('Run shortcut:', cmd, url, window?.location?.href);

  for (let item of data) {
    if (cmd === item.cmd) {
      console.info('Run cmd:', cmd);
      return item.callback();
    }
  }

  if (!url) {
    console.warn('Missing cmd and url:', window?.location?.href);
    return;
  }

  if (isApprovedUrl(url, approvedUrls)) {
    console.info('Dispatch pending url:', url);
    await addPendingRequest(url, { action: 'shortcut' });
    window.location.href = url;
  } else {
    console.warn('Unapproved url:', url);
  }
}

function isApprovedUrl(url, approvedUrls) {
  if (typeof approvedUrls !== 'object') {
    // No list of URLS -> all urls are approved!
    return true;
  }
  if (!approvedUrls?.length) {
    // Empty list of URLS -> no urls are approved!
    return false;
  }
  for (let re of approvedUrls) {
    console.log('url.match(re):', url.match(re), re);
    if (url.match(re)) {
      return true;
    }
  }
  return false;
}
