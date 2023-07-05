import Page from '../Page';
import { getRandomAPI } from '../publicApis';

export default Page;

export async function getStaticProps(...data) {
    const props = await getRandomAPI();
    console.log('+++', data);
    console.log('+++++++++++++++++++++ getStaticProps - ISR', props);

    return {
        props,
        revalidate: 30
    };
}