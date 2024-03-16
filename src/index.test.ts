import { Okareo } from './index';
import { RunTestProps } from './okareo';
import { DatapointSearch, ModelUnderTest, OpenAIModel } from "./okareo_api_client/models";

const OKAREO_API_KEY = "<YOUR_OKAREO_KEY>";
const OKAREO_BASE_URL = "https://api.okareo.com/";
const OPENAI_API_KEY = "<YOUR_OPENAI_KEY>";
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


it('Test Get Projects', async () =>  {
  const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
  const data: any[] = await okareo.getProjects();
  expect(data.length).toBeGreaterThanOrEqual(0);
});


it('Create Scenario Set', async () =>  {
  const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
  const pData: any[] = await okareo.getProjects();
  const data: any = await okareo.create_scenario_set(
    {
      name: "TS-SDK Testing Scenario Set",
      project_id: pData[0].id,
      number_examples: 1,
      generation_type: "REPHRASE_INVARIANT",
      seed_data: TEST_SEED_DATA
    }
  );
  expect(data).toBeDefined();
});


it('Generate Scenario Set From Scenario', async () =>  {
  const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
  const pData: any[] = await okareo.getProjects();
  const sData: any = await okareo.create_scenario_set(
    {
      name: "TS-SDK SEED Data",
      project_id: pData[0].id,
      number_examples: 1,
      generation_type: "SEED",
      seed_data: TEST_SEED_DATA
    }
  );
  const data: any = await okareo.generate_scenario_set(
    {
      project_id: pData[0].id,
      name: "TS-SDK Testing Generated Scenario",
      source_scenario_id: sData.scenario_id,
      number_examples: 2,
    }
  )
  expect(data).toBeDefined();
});


it('Create Scenario Data', async () =>  {
  const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
  const pData: any[] = await okareo.getProjects();
  const sData: any = await okareo.create_scenario_set(
    {
      name: "TS-SDK SEED Data",
      project_id: pData[0].id,
      number_examples: 1,
      generation_type: "SEED",
      seed_data: TEST_SEED_DATA
    }
  );
  const data: any = await okareo.get_scenario_data_points(sData.scenario_id);
  expect(data).toBeDefined();
});

it('Find Datapoints', async () =>  {
  const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
  const pData: any[] = await okareo.getProjects();
  const data: any = await okareo.find_datapoints(
    DatapointSearch({ 
      project_id: pData[0].id,
      mut_id: "1822ce2c-b663-4911-8bf1-8af592e63b62",
    })
  );
  expect(data).toBeDefined();
});

it('Register Model', async () =>  {
  const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
  const pData: any[] = await okareo.getProjects();
  const data: any = await okareo.register_model(
    ModelUnderTest({
      name: "TS-SDK Testing Model",
      tags: ["TS-SDK", "Testing"],
      project_id: pData[0].id,
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

/*
it('Upload Scenario Set', async () =>  {
  const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
  const pData: any[] = await okareo.getProjects();
  const data: any = await okareo.upload_scenario_set(
    {
      file_path: "test_data/seed_data.jsonl",
      scenario_name: "TS-SDK Testing Scenario Set",
      project_id: pData[0].id
    }
  );
  expect(data).toBeDefined();
});
*/

it('Test Evaluation', async () =>  {
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