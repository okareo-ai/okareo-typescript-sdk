import { Okareo, SeedData } from "../dist";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const UNIQUE_BUILD_ID = (process.env["github.run_number"] || `local.${(Math.random() + 1).toString(36).substring(7)}`);
let project_id: string;

describe('Checks', () => {
    beforeAll(async () => {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const pData: any[] = await okareo.getProjects();
        project_id = pData.find(p => p.name === "Global")?.id;
    });
    
    test('Generate a Check', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const check_info = {
            name: `CI: Generate Check - ${UNIQUE_BUILD_ID}`,
            project_id,
            description: "Fail the test if the output is more than 10% longer than the expected result.",
            requires_scenario_input: false,
            requires_scenario_result: true,
            output_data_type: "boolean",
        }
        const check: any = await okareo.generate_check(check_info);
        expect(check.generated_code).toBeDefined();
    });

    test('Save a Check', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const check_info = {
            name: `CI: Classifier Check - ${UNIQUE_BUILD_ID}`,
            project_id,
            description: "Return a pass if the model output matches the scenarios expected result.",
            requires_scenario_input: false,
            requires_scenario_result: true,
            output_data_type: "boolean",
        }
        const check: any = await okareo.generate_check(check_info);
        const upload_check = await okareo.upload_check({
            ...check_info,
            generated_code: check.generated_code,
            update: true
        });
        
        expect(upload_check).toBeDefined();
    });

    test('Upload a Check', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const check_info = {
            name: `CI: Uploaded Check - ${UNIQUE_BUILD_ID}`,
            project_id,
            description: "Pass if the model result length is within 10% of the expected result.",
            requires_scenario_input: false,
            requires_scenario_result: true,
            output_data_type: "boolean",
        }
        const check: any = await okareo.generate_check(check_info);
        const upload_check = await okareo.upload_check({
            ...check_info,
            file_path: "tests/example_eval.py",
            update: true
        });
        
        expect(upload_check).toBeDefined();
    });

});




