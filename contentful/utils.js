import { ENTRY_LINK_REGEXP } from './constants';

export function isEntryLink(text) {
  if (typeof text !== 'string') {
    return false;
  }

  return ENTRY_LINK_REGEXP.test(text);
}

export function getEntryLinkData(text) {
  const [, type, order] = text.match(ENTRY_LINK_REGEXP) || [];

  return {
    type,
    order: Number(order),
  };
}
