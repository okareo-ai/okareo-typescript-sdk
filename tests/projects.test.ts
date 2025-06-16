import { Okareo } from "../src";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";

describe(" Working with Projects", () => {
    test("Get Projects", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const pData: any[] = await okareo.getProjects();
        expect(pData.length).toBeGreaterThanOrEqual(0);
    });
});
