import { Okareo, TestRunType } from '../dist';
import { ModelUnderTest, OpenAIModel } from "../dist";
import { getProjectId } from './setup-env';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";
const UNIQUE_BUILD_ID = (process.env["github.run_number"] || `local.${(Math.random() + 1).toString(36).substring(7)}`);
let project_id: string;

const TEST_SEED_DATA = [
    {
      "input": "The quick brown fox jumps over the lazy dog",
      "result": "Dogs are lazy"
    },
];

describe('Evaluations', () => {
    beforeAll(async () => {
      project_id = await getProjectId();
    });
    test('Minimal Config Test Run', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        
        const scenario: any = await okareo.create_scenario_set({
            name: "Minimal Scenario Set",
            project_id: project_id,
            seed_data: TEST_SEED_DATA
        });
      
        const model = await okareo.register_model(
          ModelUnderTest({
            name: `CI: Generation ${UNIQUE_BUILD_ID}`,
            tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            model: OpenAIModel({
              api_key: OPENAI_API_KEY,
              model_id:"gpt-3.5-turbo",
              temperature:0.5,
              system_prompt_template:"Summarize the input to onely three words.",
              user_prompt_template:"{input}"
            })
          })
        );

        const scenario_id: string = scenario.scenario_id;
        const model_id: string = model.id;
        const results: any = await okareo.run_config_test({
            name: `CI: Minimal Test Run ${UNIQUE_BUILD_ID}`,
            tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
            project_id,
            scenario_id, 
            model_id,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        });
        
        expect(results).toBeDefined();
    });
    
});

