import { Okareo } from '../dist';
import { RunTestProps } from '../dist';
import { DatapointSearch, ModelUnderTest, OpenAIModel } from "../dist";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OKAREO_BASE_URL = process.env.OKAREO_BASE_URL || "https://api.okareo.com/";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";
const TEST_SEED_DATA = [
  {
    "input": "The quick brown fox jumps over the lazy dog",
    "result": "dogs are lazy"
  },
  {
    "input": "The quiet mouse ran under the lazy cat",
    "result": "cats are lazy"
  },
  {
    "input": "The barking dog chased the bird.",
    "result": "birds are fast"
  },
  {
    "input": "The patient cat lost the bird.",
    "result": "birds are fast"
  },
  {
    "input": "The turtle sat and was wonderfully warmed by the sun.",
    "result": "reptiles like the sun"
  }
];

describe('Evaluations', () => {
    test('E2E Generation Evaluation', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const random_string = (Math.random() + 1).toString(36).substring(7);
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        let sData: any = await okareo.create_scenario_set(
        {
            name: `TS-SDK SEED Data ${random_string}`,
            project_id: project_id,
            seed_data: TEST_SEED_DATA
        });
        sData = await okareo.generate_scenario_set(
        {
            name: `TS-SDK generated Data ${random_string}`,
            source_scenario_id: sData.scenario_id,
            generation_type: "REPHRASE_INVARIANT",
            number_examples: 2,
            project_id: project_id,
        }
        );
        await okareo.register_model(
          ModelUnderTest({
              name: `TS-SDK Eval Model v2 ${random_string}`,
              tags: ["TS-SDK", "Testing"],
              project_id: project_id,
              model: OpenAIModel({
              api_key: OPENAI_API_KEY,
              model_id:"gpt-3.5-turbo",
              temperature:0.5,
              system_prompt_template:"Since this is a test, always answer in a testy, snarky way. Be creatitve and have fun!",
              user_prompt_template:"How often have you been tested and found wanting?"
              }),
          })
        );
        const data: any = await okareo.run_test({
              project_id: project_id,
              scenario_id: sData.scenario_id,
              name: "TS-SDK Evaluation",
              calculate_metrics: true,
              type: "NL_GENERATION",
              checks: ["866c14bc-5201-4440-9444-456168de63bb"],
          } as RunTestProps
        );
        expect(data).toBeDefined();
    });

});




