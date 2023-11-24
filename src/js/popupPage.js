import '../styles/extension.css';

// EXPORTED FUNCTIONS ---------------------------------------------------------------

export function initPopupPage() {
  //console.log('initPopupPage');

  if (document.getElementById('hx-help')) {
    document.getElementById('hx-help').addEventListener('click', () => {
      chrome.runtime.sendMessage({ cmd: 'openTab', url: chrome.runtime.getURL('/help.html'), active: true });
      window.close();
    });
  }
  if (document.getElementById('hx-options')) {
    document.getElementById('hx-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
}

// data: [ {id: 'hx-sample', callback: () => alert('foo')}];
export function mountPopupPage(data) {
  //console.log('mountPopupPage:', data);
  if (!data) {
    return;
  }
  data.forEach((item) => {
    document.getElementById(item.id).addEventListener('click', item.callback);
  });
}
