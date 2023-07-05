import { createClient, Entry } from 'contentful';

import { APP_LOCALES } from '../constants/common';
import { CONTENT_TYPES } from '../contentful/constants';
import { ContentType, EntryLinkType } from '../contentful/enum';
import { getEntryLinkData } from '../contentful/utils';
import { groupBySysId, normalizePageUrls } from '../utils/contentful';

class ContentFulService {
 config = {
    host: process.env.CF_HOST || '',
    accessToken: process.env.CF_ACCESS_TOKEN || '',
    environment: process.env.CF_ENV || '',
    space: process.env.CF_SPACE || '',
  };

   requestMaxLimit = 100;

   includesRowData = {
    Entry: [],
    Asset: [],
  };

   includedEntries= {};

   includedAssets = {};

   getStaticPagesPromise = null;

   client = createClient(this.config);

   data = new Map();

   fetched = false;

   normalizeStaticPages(staticPagesData) {
    staticPagesData
      .map(({ fields }) => this.resolveFields(fields))
      .forEach((item) => {
        Object.entries(item.pageUrl.de.url).forEach((localeAndUrl) => {
          this.data.set(`/${localeAndUrl.join('')}`, item);
        });
      });

    return this.data;
  }

   resolveFields(fields) {
    return Object.entries(fields).reduce((acc, [fieldKey, fieldSysDataWithLocale]) => {
      acc[fieldKey] = this.resolveEntriesWithLocale(fieldSysDataWithLocale);

      return acc;
    }, {});
  }

   resolveEntriesWithLocale(sysDataWithLocale) {
    const result= {};

    for (const locale in sysDataWithLocale) {
      if (Object.prototype.hasOwnProperty.call(sysDataWithLocale, locale)) {
        const fieldSysData = sysDataWithLocale[locale];

        if (typeof fieldSysData === 'string') {
          result[locale] = fieldSysData;
        }

        if (Array.isArray(fieldSysData)) {
          result[locale] = fieldSysData.map((fieldData) => this.resolveEntry(fieldData));
        }

        if (fieldSysData.sys) {
          result[locale] = this.resolveEntry(fieldSysData);
        }
      }
    }

    return result;
  }

  resolveEntry(entry) {
    const sys = entry?.sys;
    const sysId = sys?.contentType?.sys?.id ?? sys?.id;

    if (sys) {
      entry.sys = { contentType: sys.contentType }
    }

    if (sysId === 'widget') {
      entry.fields.fields = this.replaceEntryLinks({
        data: entry.fields.fields,
        entriesLinked: entry.fields.entries,
        imagesLinked: entry.fields.images,
      });

      return entry.fields;
    }

    if (sysId === 'richTextBlock') {
      return entry.fields.content;
    }

    if (sys?.type == 'Asset') {
      return this.resolveAsset(this.includedAssets[sysId]);
    }

    if (sysId && !CONTENT_TYPES.includes(sysId) && this.includedEntries[sysId]) {
      return this.resolveEntry(this.includedEntries[sysId]);
    }

    if (entry?.fields) {
      return entry?.fields;
    }

    return entry;
  }

  replaceEntryLinks({ data, locale, entriesLinked, imagesLinked }) {
    if (!entriesLinked && !imagesLinked) {
      return data;
    }

    return Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = this.replaceLink({
        value,
        locale: APP_LOCALES.includes(key) ? key : locale,
        entriesLinked,
        imagesLinked,
      });

      return acc;
    }, {});
  }

  replaceLink({ value, locale, entriesLinked, imagesLinked }) {
    if (!value) {
      return value;
    }

    if (typeof value === 'string') {
      const { type, order } = getEntryLinkData(value);
      const list = type === EntryLinkType.Entry ? entriesLinked : imagesLinked;

      return (locale ? list?.[locale] : list)?.[order - 1] ?? value;
    } else if (Array.isArray(value)) {
      return value.map((val) => this.replaceLink({ value: val, locale, entriesLinked, imagesLinked }));
    } else if (typeof value === 'object') {
      return this.replaceEntryLinks({ data: value, locale, entriesLinked, imagesLinked });
    }

    return value;
  }

  async getPageUrls(urls = [], skip = 0) {
    const pageUrlsData = await this.client.withAllLocales.getEntries({
      content_type: ContentType.PageUrl,
      include: 5,
      select: ['fields'],
      skip,
      'sys.id[in]': '1sSXQ6TLqttH8eU3lvzE7g,2HC47Rlszcq0aCDger0hJE', // compliance, newsletter
      // 'sys.id': '2HC47Rlszcq0aCDger0hJE', // newsletter
    });

    urls.push(...pageUrlsData.items);

    const isLastCall = pageUrlsData.items.length < this.requestMaxLimit;

    if (isLastCall) {
      console.log('\x1b[32m%s\x1b[0m', '[Contentful Service] - fetched url objects', urls.length);

      return normalizePageUrls(urls);
    }

    return this.getPageUrls(urls, skip + this.requestMaxLimit);
  }

  async getStatic() {
    // if (!this.getStaticPagesPromise) {
    this.getStaticPagesPromise = this.getStaticPages();
    // }

    return this.getStaticPagesPromise;
  }

  async getStaticPages(
    staticPages = [],
    skip = 0
  ) {
    if (this.fetched) {
      // return this.data;
    }

    const { items, includes } = await this.client.withAllLocales.getEntries({
      content_type: ContentType.StaticPage,
      include: 5,
      select: ['fields'],
      skip,
      'sys.id[in]': '5FjYEssDYCn4CTcAbtNkDJ,4APlYcyIsWFzHQ2XK6J6pZ', // compliance, newsletter
      // 'sys.id': '4APlYcyIsWFzHQ2XK6J6pZ', // newsletter, 
    });

    staticPages.push(...items);
    includes?.Entry && this.includesRowData.Entry.push(...includes.Entry);
    includes?.Asset && this.includesRowData.Asset.push(...includes.Asset);

    const isLastCall = items.length < this.requestMaxLimit;

    if (isLastCall) {
      this.fetched = true;

      this.includedEntries = groupBySysId(this.includesRowData.Entry);
      this.includedAssets = groupBySysId(this.includesRowData.Asset);

      console.log('\x1b[32m%s\x1b[0m', '[Contentful Service] - fetched static pages', staticPages.length);
      console.log(
        '\x1b[32m%s\x1b[0m',
        '[Contentful Service] - fetched included entries',
        this.includesRowData.Entry.length
      );
      console.log(
        '\x1b[32m%s\x1b[0m',
        '[Contentful Service] - fetched included assets',
        this.includesRowData.Asset.length
      );

      return this.normalizeStaticPages(staticPages);
    }
    return this.getStaticPages(staticPages, skip + this.requestMaxLimit);
  }

  resolveAsset(entry) {
    const {
      fields: { file, title, description },
    } = entry;

    return {
      file,
      title,
      description,
    };
  }
}

export default new ContentFulService();
