import { Okareo } from '../dist';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";

describe(' Working with Projects', () => {
    test('Get Projects', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const pData: any[] = await okareo.getProjects();
        expect(pData.length).toBeGreaterThanOrEqual(0);
    });
/*
    test('Create CI Project', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const pData: any[] = await okareo.getProjects();
        const demo_project_id: string = pData.find((project: any) => project.name === "Demo")?.id;
        if (!demo_project_id) {
            const global = await okareo.createProject({ name: "Demo" } );
        }
        const fData: any[] = await okareo.getProjects();
        expect(fData.length).toBeGreaterThanOrEqual(2);
    });
*/
});

