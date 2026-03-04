import { fetchConflictsAndCrises } from '../src/services/reliefWeb.js';

async function test() {
    const data = await fetchConflictsAndCrises();
    console.log(JSON.stringify(data.features.slice(0, 3), null, 2));
}

test();
