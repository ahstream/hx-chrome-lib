import '../styles/extension.css';

import { getStorageItems, setStorageData } from './storage';
import { createHashArgs, createLogger } from '@ahstream/hx-lib';

const debug = createLogger();

// DATA ----------------------------------------------------------------------------

// const INFO_ICON = chrome.runtime.getURL('images/info.png');
// const INFO_ICON = import('../images/info.png');
const INFO_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>';

const MIN_TEXT_INPUT_LENGTH = 30;
const DEFAULT_TEXTAREA_ROWS = 3;

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
  // const infoHTML = infoText ? `<img class="info" src="${INFO_ICON}" title="${infoText}" />` : '';
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
      <label>${labelText}:</label>
      ${infoHTML}
      <textarea cols="100" rows="${length}" id="${name}">${valText}</textarea>
    </div>`;
  }

  if (typeof val === 'boolean') {
    return `<div class="row">
      <input type="checkbox" id="${name}" ${val ? 'checked' : ''} />
      <label for="${name}">${labelText}</label>
      ${infoHTML}
    </div>`;
  }

  const valText = convertStringVal(val, 'error');
  const valLength = valText.length;
  const length = valLength > minLength ? valLength : minLength;
  const typedLength = typeof val === 'number' ? 8 : length;
  const labelAfter = textAfter ? `<label class="labelAfter">${textAfter}</label>` : ``;
  return `<div class="row">
    <label>${labelText}:</label>
    <input type="text" id="${name}" placeholder="" size="${typedLength}" value='${valText}' />
    ${labelAfter}
    ${infoHTML}
  </div>`;
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
      <label>${labelText}:</label>
      ${infoHTML}</td><td NOWRAP>
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
    <label>${labelText}:</label></td><td NOWRAP>
    <input type="text" id="${name}" placeholder="" ${styleHTML} value='${valText}' />
    ${labelAfter}
    ${infoHTML}
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
  return infoText ? `<a href="#" class="info" title="${infoText}">${INFO_ICON}"</a>` : '';
}
