import { getStorageData, setStorageData } from './storage';

// EXPORTED FUNCTIONS

export async function initOptions(defaultOptions = {}, overrideOptions = {}, customOptions = {}) {
  const storage = await getStorageData();
  storage.options = storage.options || {};
  const finalOptions = { ...defaultOptions, ...storage.options, ...overrideOptions, ...customOptions };
  console.log('storages:', {
    storage,
    defaultOptions,
    currentOptions: storage.options,
    overrideOptions,
    customOptions,
    finalOptions,
  });
  storage.options = finalOptions;
  await setStorageData({ options: finalOptions });
}
