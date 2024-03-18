import { Okareo } from '../src';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OKAREO_BASE_URL = process.env.OKAREO_BASE_URL || "https://api.okareo.com/";

describe(' Working with Projects', () => {
    test('Get Projects', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const data: any[] = await okareo.getProjects();
        expect(data.length).toBeGreaterThanOrEqual(0);
    });
});

