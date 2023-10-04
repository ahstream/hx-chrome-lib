import '../styles/extension.css';

import { getStorageItems, setStorageData, createHashArgs, createLogger } from 'hx-lib';

const debug = createLogger();

// DATA ----------------------------------------------------------------------------

// const INFO_ICON = chrome.runtime.getURL('images/info.png');
// const INFO_ICON = import('../images/info.png');
const INFO_ICON = `<svg class='info' xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>`;
// const INFO_ICON = ``;

// const INFO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 448c-110.532 0-200-89.431-200-200 0-110.495 89.472-200 200-200 110.491 0 200 89.471 200 200 0 110.53-89.431 200-200 200zm107.244-255.2c0 67.052-72.421 68.084-72.421 92.863V300c0 6.627-5.373 12-12 12h-45.647c-6.627 0-12-5.373-12-12v-8.659c0-35.745 27.1-50.034 47.579-61.516 17.561-9.845 28.324-16.541 28.324-29.579 0-17.246-21.999-28.693-39.784-28.693-23.189 0-33.894 10.977-48.942 29.969-4.057 5.12-11.46 6.071-16.666 2.124l-27.824-21.098c-5.107-3.872-6.251-11.066-2.644-16.363C184.846 131.491 214.94 112 261.794 112c49.071 0 101.45 38.304 101.45 88.8zM298 368c0 23.159-18.841 42-42 42s-42-18.841-42-42 18.841-42 42-42 42 18.841 42 42z"/></svg>`;

// const INFO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM169.8 165.3c7.9-22.3 29.1-37.3 52.8-37.3h58.3c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24V250.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1H222.6c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg>`;

const MIN_TEXT_INPUT_LENGTH = 30;
const DEFAULT_TEXTAREA_ROWS = 4;

let storage;

// EXPORTED FUNCTIONS ---------------------------------------------------------------

export async function initOptionsPage() {
  console.log('initPopupPage');
}

export async function mountOptionsPage(data) {
  console.log('mountOptionsPage:', data);

  storage = await getStorageItems(['options']);
  debug.info('storage', storage);

  if (!storage?.options) {
    return debug.info('Options missing, exit!');
  }

  if (window.location.href.toLowerCase().includes('=all')) {
    let allOptions = [];
    for (const item of Object.entries(storage.options)) {
      allOptions.push(['property', item[0], item[0]]);
    }
    debug.info(allOptions);
    debug.info(data);
    addOptions([
      {
        header: 'All options',
        options: [
          ['description', 'Only modify options in this view if you have been told to do it by Chrome Extension developer!'],
          ...allOptions,
        ],
      },
    ]);
  } else {
    addOptions(data);
  }

  document.getElementById('saveBtn').addEventListener('click', () => saveOptions());
  document.getElementById('closeBtn').addEventListener('click', () => window.close());
}

// HELPER FUNCTIONS ---------------------------------------------------------------

function addOptions(sectionsArr) {
  debug.info('addOptions', sectionsArr);

  const hashArgs = createHashArgs(window.location.hash);
  debug.info('hashArgs', hashArgs);

  let html = '';

  for (const section of sectionsArr) {
    if (section.hiddenKey && !hashArgs.has('config', section.hiddenKey)) {
      debug.info('Skip hidden config:', section);
      continue;
    }
    html = html + `<div class="section"><span>${section.header}</span></div>`;
    html = html + addOptionsArr(section.options);
  }
  document.getElementById('mount-options').innerHTML = html;
}

function addOptionsArr(optionsArr) {
  debug.info('addOptionsArr', optionsArr);

  let html = '';

  for (const option of optionsArr) {
    const key = option[0];

    if (key === 'table') {
      html = html + '<table>' + addOptionsArr(option[1]) + '</table>';
      continue;
    }

    if (key === 'box') {
      html = html + '<div class="box">' + addOptionsArr(option[1]) + '</div>';
      continue;
    }

    if (key === 'subheader') {
      html = html + createSubheader(option[1]);
      continue;
    }

    if (key === 'description') {
      html = html + createDescription(option[1]);
      continue;
    }

    if (key === 'propertyCell') {
      const name = option[1];
      html = html + createPropertyCell(name, storage.options[name], option[2], option[3], option[4]);
      continue;
    }

    if (key === 'spaceCell') {
      html = html + createSpaceCell(option[1]);
      continue;
    }

    if (key === 'property') {
      const name = option[1];
      html = html + createProperty(name, storage.options[name], option[2], option[3], option[4]);
      continue;
    }

    if (key === 'radioButtons') {
      const name = option[1];
      html = html + createRadioButtons(name, storage.options[name], option[2], option[3]);
      continue;
    }

    if (key === 'checkboxCombo') {
      const name1 = option[1];
      const text1 = option[2];
      const name2 = option[3];
      html = html + createCheckboxCombo(name1, storage.options[name1], text1, name2, storage.options[name2]);
      continue;
    }

    if (key === 'space') {
      html = html + createSpace(option[1]);
      continue;
    }

    return html;
  }

  return html;
}

async function saveOptions(closeAfter = false) {
  debug.info('saveOptions', closeAfter);

  const radios = [...document.querySelectorAll('input[type="radio"]')];
  const cbs = [...document.querySelectorAll('input[type="checkbox"]')];
  const texts = [...document.querySelectorAll('input[type="text"]')];
  const textareas = [...document.querySelectorAll('textarea')];

  radios.forEach((r) => {
    if (r.checked) {
      storage.options[r.name] = r.value;
    }
  });

  cbs.forEach((cb) => {
    storage.options[cb.id] = cb.checked;
  });

  texts.forEach((text) => {
    const key = text.id;
    const val = typeof storage.options[key] === 'number' ? Number(text.value) : text.value;
    storage.options[key] = val;
  });

  textareas.forEach((textarea) => {
    const key = textarea.id;
    const val = textarea.value.split('\n').filter((x) => x.length);
    storage.options[key] = val;
  });

  await setStorageData(storage);
  debug.info('options', storage.options);

  document.getElementById('statusText').classList.toggle('visible');
  document.getElementById('statusText').textContent = 'Options saved!';
  if (closeAfter) {
    window.close();
  }
  setTimeout(function () {
    document.getElementById('statusText').classList.toggle('visible');
    document.getElementById('statusText').textContent = '';
  }, 2500);
}

function createSubheader(text) {
  return `<div class="subheader"><span>${text}</span></div>`;
}

function createDescription(text) {
  return `<div class="description"><span>${text}</span></div>`;
}

function createSpace(pixels) {
  return `<div class="space" style="height: ${pixels}px"></div>`;
}

function createRadioButtons(name, val, arr, infoText = null) {
  const infoHTML = getInfoHTML(infoText);

  const radioHTML = arr.map((item) => {
    const checked = item[0] === val;
    return `<input type="radio" id="${item[0]}" name="${name}" value="${item[0]}" ${checked ? 'checked ' : ''}> <label for="${item[0]}">${
      item[1]
    }</label>`;
  });

  return `<div class="row">
      ${radioHTML.join('\n')}
      ${infoHTML}
    </div>`;
}

function createCheckboxCombo(name, val, text, name2, val2, minLength = MIN_TEXT_INPUT_LENGTH) {
  const labelText = typeof text === 'string' ? text : name;

  const valText = convertStringVal(val2, 'error');
  const valLength = valText.length;
  const length = valLength > minLength ? valLength : minLength;
  const typedLength = typeof val2 === 'number' ? 8 : length;

  return `<div class="row">
      <input type="checkbox" id="${name}" ${val ? 'checked' : ''} />
      <label for="${name}">${labelText}</label>
      <input type="text" id="${name2}" placeholder="" size="${typedLength}" value='${valText}' />
    </div>`;
}

function createProperty(name, val, text, textAfter = null, infoText = null, minLength = MIN_TEXT_INPUT_LENGTH) {
  const labelText = typeof text === 'string' ? text : name;

  const infoHTML = getInfoHTML(infoText);

  if (typeof val === 'object') {
    if (typeof val.length === 'undefined') {
      debug.info('Skip invalid option:', name, val, text);
      return '';
    }
    let length = val.length > DEFAULT_TEXTAREA_ROWS ? DEFAULT_TEXTAREA_ROWS : Math.max(3, val.length);
    if (length === val.length) {
      length++;
    }
    const valText = valOrDefault(val.join('\n'), '');
    return `<div class="col">
      <label for="${name}" title='${infoText}'>${labelText} ${infoHTML} </label>
      <textarea cols="100" rows="${length}" id="${name}">${valText}</textarea>
    </div>`;
  }

  if (typeof val === 'boolean') {
    return `<div class="row">
      <input type="checkbox" id="${name}" ${val ? 'checked' : ''} />
      <label for="${name}" title='${infoText}'>${labelText} ${infoHTML} </label>
    </div>`;
  }

  const valText = convertStringVal(val, 'error');
  const valLength = valText.length;
  const length = valLength > minLength ? valLength : minLength;
  const typedLength = typeof val === 'number' ? 8 : length;
  const labelAfter = textAfter ? `<label class="labelAfter">${textAfter}</label>` : ``;
  return `<div class="row">
    <label for="${name}" title='${infoText}'>${labelText}: ${infoHTML} </label>
    <input type="text" id="${name}" placeholder="" size="${typedLength}" value='${valText}' />
    ${labelAfter}
  </div>`;
}

function createSpaceCell(pixels) {
  return `<tr><td NOWRAP style="height: ${pixels}px"></td><td NOWRAP></td></tr>`;
}

function createPropertyCell(name, val, text, textAfter = null, infoText = null, minLength = MIN_TEXT_INPUT_LENGTH) {
  const labelText = typeof text === 'string' ? text : name;

  const infoHTML = getInfoHTML(infoText);

  if (typeof val === 'object') {
    let length = val.length > DEFAULT_TEXTAREA_ROWS ? DEFAULT_TEXTAREA_ROWS : Math.max(3, val.length);
    if (length === val.length) {
      length++;
    }
    const valText = valOrDefault(val.join('\n'), '');
    return `<tr><td NOWRAP>
      <label for="${name}" title='${infoText}'>${labelText}: ${infoHTML} </label>
      </td><td NOWRAP>
      <textarea cols="100" rows="${length}" id="${name}">${valText}</textarea>
    </td></tr>`;
  }

  const valText = convertStringVal(val, 'error');
  const valLength = valText.length;
  const length = valLength > minLength ? valLength : minLength;
  const typedLength = typeof val === 'number' ? 8 : length;
  const labelAfter = textAfter ? `<label class="labelAfter">${textAfter}</label>` : ``;
  const width = typedLength * 10 + 40;
  const styleHTML = `style="width:${width}px"`;
  return `<tr><td NOWRAP>
  <label for="${name}" title='${infoText}'>${labelText}: ${infoHTML} </label></td><td NOWRAP>
    <input type="text" id="${name}" placeholder="" ${styleHTML} value='${valText}' />
    ${labelAfter}
    </td></tr>`;
}

function valOrDefault(val, defaultVal) {
  const returnVal = val === undefined || val === null ? defaultVal : val;
  return returnVal;
}

function convertStringVal(val, defaultVal) {
  const newVal = valOrDefault(val, defaultVal);
  return newVal.toString();
}

function getInfoHTML(infoText) {
  // return infoText ? `<a href="#" class="info" title="${infoText}">${INFO_ICON}</a>` : '';
  return infoText ? `&nbsp;${INFO_ICON}` : '';
}
