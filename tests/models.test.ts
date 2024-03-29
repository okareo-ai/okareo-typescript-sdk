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

describe('Model Interactions', () => {
    test('Register Model', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const data: any = await okareo.register_model(
        ModelUnderTest({
            name: "TS-SDK Testing Model",
            tags: ["TS-SDK", "Testing"],
            project_id: project_id,
            model: OpenAIModel({
            api_key: OPENAI_API_KEY,
            model_id:"gpt-3.5-turbo",
            temperature:0.5,
            system_prompt_template:"Since this is a test, always answer in a testy, snarky way.",
            user_prompt_template:"How often have you been tested and fround wanting?"
            }),
        })
        );
        
        expect(data).toBeDefined();
    });

    test('Find Datapoints', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const data: any = await okareo.find_datapoints(
        DatapointSearch({ 
            project_id: project_id,
            mut_id: "1822ce2c-b663-4911-8bf1-8af592e63b62",
        })
        );
        expect(data).toBeDefined();
    });

});
