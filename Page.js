import { useRouter } from 'next/router';
import { size } from './utils/size';

function renderDetails(data, key) {
    if (!data || typeof data !== 'object') {
      return (
        <details open>
          <summary>{key}</summary>
          <p>{data}</p>
        </details>
      );
    }
  
    return (
      <details style={{paddingLeft: '100px'}}>
        <summary>{key}</summary>
        <ul>
          {Object.entries(data ?? {}).map(([key, d]) => (
            <li>{renderDetails(d, key)}</li>
          ))}
        </ul>
      </details>
    );
}

export default function Page(props) {
    const { isFallback, query } = useRouter();

    if (isFallback) {
        console.log('----------- Fallback', Object.keys(props))
        return <>Fallback Page</>;
    }

    console.log('----------- Page', size(props), Object.keys(props))

    return <div>
        <h1>ISR Demo</h1>
        <h2>{props.name}</h2>
        <p>{props.description}</p>
        <h1>{(Array.isArray(query.slug) ? query.slug : [query.slug]).join('/')}</h1>
        {renderDetails(props, props?.internalName)}
    </div>
}