import { Okareo } from '../dist';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";

describe('Minimal Runner', () => {
    test('Config Classification', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const scenario_id: string = "733ab11a-cee5-49e4-b0f6-c2386752c9ac";
        const model_id: string = "1c2298d8-0223-4b0a-bc88-1c67a4807b4f";
        const results: any = await okareo.run_config_test({
            project_id,
            scenario_id, 
            model_id,
            type: "MULTI_CLASS_CLASSIFICATION",
        });
        console.log(JSON.stringify(results, null, 2));
        expect(results).toBeDefined();
    });
    test('Config Generation Checks', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const scenario_id: string = "7cf8e6df-6023-47ed-b2eb-8d1ff8ed1c2f";
        const model_id: string = "a664de82-d9fe-482b-815f-8b007edb70d6";
        const results: any = await okareo.run_config_test({
            project_id,
            scenario_id, 
            model_id,
            type: "NL_GENERATION",
            checks: [
                "uniqueness",
                "fluency"
            ]
        });
        expect(results).toBeDefined();
    });
    //


});

