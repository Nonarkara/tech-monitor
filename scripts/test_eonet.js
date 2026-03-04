import { fetchNaturalDisasters } from '../src/services/nasaEonet.js';

async function test() {
    const data = await fetchNaturalDisasters();
    const iranDisasters = data.features.filter(f =>
        f.geometry.coordinates[0] > 44 && f.geometry.coordinates[0] < 63 &&
        f.geometry.coordinates[1] > 25 && f.geometry.coordinates[1] < 39
    );
    console.log(JSON.stringify(iranDisasters, null, 2));
}

test();
