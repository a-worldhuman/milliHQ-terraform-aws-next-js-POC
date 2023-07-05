import fetch from 'node-fetch';

function getApis() {
    return new Promise((res, rej) => {
        fetch('https://api.publicapis.org/random')
            .then((res) => res.json())
            .then((data) => setTimeout(() => res(data), 10000))
            .catch((err) => rej(err));
    });
}

export async function getRandomAPI() {
    console.log('Fetching data .....');

    const json = await getApis();

    return {
        name: json.entries[0].API,
        description: json.entries[0].Description,
    };
}