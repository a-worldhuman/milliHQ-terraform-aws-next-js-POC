import { APP_LOCALES, DEFAULT_LOCALE } from '../constants/common';
import { PageUrlStatus, PageVersion } from '../contentful/enum';

function isPrimitive(val) {
  return ['string', 'number', 'boolean', 'symbol', 'bigint', 'undefined'].includes(typeof val);
}

function hasLocalizedChild(data, locale) {
  return typeof data?.[locale] !== 'undefined' || typeof data?.[DEFAULT_LOCALE] !== 'undefined';
}

function filterAvailablePages(path, status, locale) {
  return !path.startsWith(`/${PageVersion.V1}`) && status[locale] === PageUrlStatus.OK;
}

export const getLocalizedChild = (data, locale) => {
  if (!data || isPrimitive(data)) {
    return data;
  }

  if (typeof data[locale] !== 'undefined') {
    return data[locale];
  }

  if (typeof data[DEFAULT_LOCALE] !== 'undefined') {
    return data[DEFAULT_LOCALE];
  }

  return data;
};

export function unpackLocale(data, locale) {
  if (data === null || isPrimitive(data)) {
    return data;
  }

  if (hasLocalizedChild(data, locale)) {
    return unpackLocale(getLocalizedChild(data, locale), locale);
  }

  if (Array.isArray(data)) {
    return data.map((item) => (isPrimitive(item) ? item : unpackLocale(item, locale)));
  }

  const iterated = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      iterated[key] = isPrimitive(data[key]) ? data[key] : unpackLocale(data[key], locale);
    }
  }

  return iterated;
}

export function normalizePageUrls(pageUrls) {
  return pageUrls
    .map(({ fields: { url, status } }) =>
      Object.entries(url)
        .filter(([locale, path]) => filterAvailablePages(path, status, locale))
        .map(([locale, path]) => ({
          params: {
            slug: [locale].concat(path.split('/').filter(Boolean)),
          },
        }))
    )
    .flat();
}

export function groupBySysId(entrylist) {
  return entrylist.reduce((acc, item) => {
    acc[item.sys.id] = item;

    return acc;
  }, {});
}

export function isLocale(locale) {
  return APP_LOCALES.includes(locale);
}