import { Okareo } from '../dist';
import { RunTestProps } from '../dist';
import { DatapointSearch, ModelUnderTest, OpenAIModel, TestRunType } from "../dist";
import { getProjectId } from './setup-env';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";
const UNIQUE_BUILD_ID = (process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
let project_id: string;

const SYSTEM_PROMPT: string = `You will get some a long passage of text.  As an expert at distilling information to the most basic results, provide a short one sentence summary of the provided material.`;
const USER_PROMPT: string = `{input}`;

let model: any;

describe('Model Interactions', () => {
  beforeAll(async () => {
    const okareo = new Okareo({api_key:OKAREO_API_KEY });
    project_id = await getProjectId();
    const upload_scenario: any = await okareo.upload_scenario_set(
      {
        name: `CI: Upload WebBizz Scenario`,
        file_path: "./tests/generation_scenario.jsonl",
        project_id: project_id,
      }
    );
    
    model = await okareo.register_model(
      ModelUnderTest({
        name: `CI: Generation ${UNIQUE_BUILD_ID}`,
        tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
        project_id: project_id,
        model: OpenAIModel({
          model_id:"gpt-3.5-turbo",
          temperature:0.5,
          system_prompt_template:SYSTEM_PROMPT,
          user_prompt_template:USER_PROMPT
        })
      })
    );
      
    await okareo.run_test({
      model_api_key: OPENAI_API_KEY,
      name: `CI: Custom Test Run ${UNIQUE_BUILD_ID}`,
      tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
      project_id: project_id,
      scenario: upload_scenario,
      calculate_metrics: true,
      type: TestRunType.NL_GENERATION,
      checks: [
        "consistency_summary",
        "relevance_summary"
      ],
    } as RunTestProps);
      
  });

  test('Create or Return Model', async () =>  {
      const okareo = new Okareo({api_key:OKAREO_API_KEY});
      const existing_model = await okareo.register_model(
        ModelUnderTest({
          name: `CI: Generation ${UNIQUE_BUILD_ID}`,
          tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
          project_id: project_id,
          model: OpenAIModel({
            model_id:"gpt-3.5-turbo",
            temperature:0.5,
            system_prompt_template:SYSTEM_PROMPT,
            user_prompt_template:USER_PROMPT
          })
        })
      );
      expect(existing_model).toBeDefined();
      expect(existing_model.models?.['openai']?.api_keys).toBeUndefined();
  });

  test('Find Datapoints', async () =>  {
      const okareo = new Okareo({api_key:OKAREO_API_KEY});
      const datapoints: any = await okareo.find_datapoints(
        DatapointSearch({ 
            project_id: project_id,
            mut_id: model.id,
        })
      );
      
      expect(datapoints.length).toBeGreaterThan(0);
  });

});
