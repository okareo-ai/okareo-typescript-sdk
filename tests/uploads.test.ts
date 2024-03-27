import { Okareo } from '../src';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OKAREO_BASE_URL = process.env.OKAREO_BASE_URL || "https://api.okareo.com/";

describe('Upload Scenarios', () => {
    it('Upload Scenario Set', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const pData: any[] = await okareo.getProjects();
        const data: any = await okareo.upload_scenario_set(
          {
            file_path: "./tests/upload_file.jsonl",
            scenario_name: "Upload Scenario Set",
            project_id: pData[0].id
          }
        );
        
        expect(data.app_link).toBeDefined();

    });

});

