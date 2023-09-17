import { addPendingRequest, createHashArgs, millisecondsAhead, sleep, minutesBetween } from '@ahstream/hx-lib';

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
      await waitForDelay();
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

let delayUntil = null;

async function waitForDelay() {
  if (!window?.location?.hash) {
    return;
  }
  const hashArgs = createHashArgs(window.location.hash);
  console.log(hashArgs);
  const delaySecs = hashArgs.hashArgs.delaySecs?.length ? Number(hashArgs.hashArgs.delaySecs[0]) : 0;
  if (!delaySecs) {
    return;
  }
  const runAt = new Date(millisecondsAhead(delaySecs * 1000, new Date()));
  delayUntil = runAt;

  const span = document.createElement('span');
  span.id = 'delay-msg';
  span.style.fontSize = '2.8em';
  span.style.textAlign = 'center';
  span.style.width = '100%';
  span.style.display = 'block';
  span.style.paddingTop = '20%';
  document.body.style.backgroundColor = 'orange';
  document.body.appendChild(span);
  updateDelayMsg();
  await sleep(delaySecs * 1000);
}

function updateDelayMsg() {
  const m = minutesBetween(new Date(), delayUntil);
  const runAtStr = delayUntil.toLocaleTimeString();
  document.getElementById('delay-msg').innerText = `Delay run of shortcut ${m} minutes until ${runAtStr}`;
  setTimeout(updateDelayMsg, 60 * 1000);
}

function isApprovedUrl(url, approvedUrls) {
  console.info('isApprovedUrl; url, approvedUrls:', url, approvedUrls);
  if (!Array.isArray(approvedUrls)) {
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
