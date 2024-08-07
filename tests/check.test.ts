import { get } from "http";
import { readFileSync } from 'fs';
import { join } from 'path';
import { Okareo, SeedData, CheckCreateUpdateProps, CheckOutputType } from "../dist";
import { getProjectId } from './setup-env';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const UNIQUE_BUILD_ID = (process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
let project_id: string;

describe('Checks', () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });
    
    test('Generate a Check', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const check_info = {
            name: `CI: Generate Check - ${UNIQUE_BUILD_ID}`,
            project_id,
            description: "Fail the test if the output is more than 10% longer than the expected result.",
            requires_scenario_input: false,
            requires_scenario_result: true,
            output_data_type: "bool",
        }
        const check: any = await okareo.generate_check(check_info);
        expect(check.generated_code).toBeDefined();
    });

    test('Upload a Code-based Check', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const filePath = join(__dirname, 'example_eval.py');
        const code_contents = readFileSync(filePath, 'utf8');
        const check_config = {
            code_contents,
            type: CheckOutputType.PASS_FAIL,
        };
        const check_info = {
            project_id,
            name: `CI: Uploaded Code-based Check - ${UNIQUE_BUILD_ID}`,
            description: "Pass if the model result length is within 10% of the expected result.",
            check_config,
        } as CheckCreateUpdateProps;
        const upload_check: any = await okareo.create_or_update_check(check_info);
        
        expect(upload_check).toBeDefined();
        
        //const del_data = await okareo.delete_check(upload_check.id, upload_check.name);
        //expect(del_data).toEqual("Check deletion was successful");
        
    });

    test('Upload a Model-based Check', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const prompt = "Only output True if the model_output is at least 20 characters long, otherwise return False.";
        const check_config = {
            prompt_template: prompt,
            type: CheckOutputType.PASS_FAIL,
        };
        const check_info = {
            project_id,
            name: `CI: Uploaded Model-based Check - ${UNIQUE_BUILD_ID}`,
            description: prompt,
            check_config,
        } as CheckCreateUpdateProps;
        const upload_check: any = await okareo.create_or_update_check(check_info);
        
        expect(upload_check).toBeDefined();
        
        //const del_data = await okareo.delete_check(upload_check.id, upload_check.name);
        //expect(del_data).toEqual("Check deletion was successful");
        
    });

    test('Get Check(s)', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const allEvals = await okareo.get_all_checks();
        expect(allEvals).toBeDefined();
        let evalObj;
        if (allEvals.length > 0) {
        const eval_id = allEvals[0].id;
        evalObj = (eval_id)?await okareo.get_check(eval_id):null;
        }
        expect(evalObj).toBeDefined();
    });

});




