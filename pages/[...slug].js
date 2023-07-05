import Page from '../Page';
import contentful from '../services/contentful';
import { isLocale, unpackLocale } from '../utils/contentful';
import isEmpty from 'lodash/isEmpty';
import safeJsonStringify from 'safe-json-stringify';
import { size } from '../utils/size';

export default Page;

export async function getStaticProps({params}) {
    const { slug } = params;
    const [locale] = slug;
    const url = `/${slug.join('/')}`;

    console.log('+++++++++++++++++++++ dynamic -  getStaticProps - ISR - URL', url);

    const pages = await contentful.getStaticPages();

    const pageData = pages.get(url);
    const props =
        !isEmpty(pageData) && isLocale(locale) ? unpackLocale(JSON.parse(safeJsonStringify(pageData)), locale) : {};

    console.log('+++++++++++++++++++++  SIZE', props?.internalName, size(props));

    return {
        props,
        revalidate: 30
    };
}

export async function getStaticPaths() {
    const paths = await contentful.getPageUrls();

    console.log('.......... getStaticPaths', JSON.stringify(paths.map((p) => p.params.slug)));

    return {
        paths: [ { params: { slug: ['slug-1'] } }, { params: { slug: ['slug-2'] } }, ...paths ],
        fallback: false
    };
}