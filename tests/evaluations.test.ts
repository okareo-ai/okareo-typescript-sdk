import { Okareo } from '../src/index';
import { RunTestProps } from '../src/okareo';
import { DatapointSearch, ModelUnderTest, OpenAIModel } from "../src/okareo_api_client/models";

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
        const pData: any[] = await okareo.getProjects();
        const sData: any = await okareo.create_scenario_set(
        {
            name: "TS-SDK SEED Data",
            project_id: pData[0].id,
            number_examples: 2,
            generation_type: "REPHRASE_INVARIANT",
            seed_data: TEST_SEED_DATA
        }
        );
        await okareo.register_model(
        ModelUnderTest({
            name: "TS-SDK Eval Model v2",
            tags: ["TS-SDK", "Testing"],
            project_id: pData[0].id,
            model: OpenAIModel({
            api_key: OPENAI_API_KEY,
            model_id:"gpt-3.5-turbo",
            temperature:0.5,
            system_prompt_template:"Since this is a test, always answer in a testy, snarky way. Be creatitve and have fun!",
            user_prompt_template:"How often have you been tested and found wanting?"
            }),
        }));
        const data: any = await okareo.run_test({
            project_id: pData[0].id,
            scenario_id: sData.scenario_id,
            name: "TS-SDK Evaluation",
            calculate_metrics: true,
            type: "NL_GENERATION",
        } as RunTestProps
        );
        expect(data).toBeDefined();
    });

});




