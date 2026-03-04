import axios from 'axios';

async function test() {
    const response = await axios.post('https://api.reliefweb.int/v1/disasters?appname=techmonitor', {
        profile: "full",
        limit: 100,
        filter: {
            operator: "AND",
            conditions: [
                {
                    field: "status",
                    value: "current"
                }
            ]
        }
    });

    const items = response.data.data.map(d => ({
        name: d.fields.name,
        country: d.fields.primary_country?.name,
        type: d.fields.type?.map(t => t.name).join(', ')
    }));
    console.log(items.filter(i => i.country === 'Iran (Islamic Republic of)' || i.name.includes('Iran') || i.country === 'Israel' || i.name.includes('Israel') || i.country === 'Ukraine'));
}

test();
