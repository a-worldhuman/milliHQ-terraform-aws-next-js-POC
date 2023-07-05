// export default async function handler(req, res) {
//     console.log('........ Revalidating');

//     let revalidated = false;

//     try {
//         await res.revalidate('/isr');
//         revalidated = true;
//         console.log('........ Revalidated');
//     } catch (e) {
//       console.error('Error while revalidating', e);
//     }

//     res.json({ revalidated });
// }