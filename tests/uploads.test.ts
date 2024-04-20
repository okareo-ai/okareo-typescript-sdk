import { Okareo } from '../dist';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";

describe('Upload Scenarios', () => {
    it('Upload Scenario Set', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const data: any = await okareo.upload_scenario_set(
          {
            file_path: "./tests/upload_file.jsonl",
            scenario_name: "Upload Scenario Set",
            project_id: project_id
          }
        );
        
        expect(data.app_link).toBeDefined();

    });

});

