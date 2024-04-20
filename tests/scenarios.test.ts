import { Okareo } from '../dist';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
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

describe(' Working with Scenarios', () => {
    test('Create New Scenario Seed', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const data: any = await okareo.create_scenario_set(
            {
            name: "TS-SDK Testing Scenario Set",
            project_id: project_id,
            seed_data: TEST_SEED_DATA
            }
        );
        expect(data).toBeDefined();
    });

    test('Generate Scenario Set From Existing Scenario', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const sData: any = await okareo.create_scenario_set(
          {
            name: "TS-SDK SEED Data",
            project_id: project_id,
            seed_data: TEST_SEED_DATA
          }
        );
        const random_string = (Math.random() + 1).toString(36).substring(7);
        const data: any = await okareo.generate_scenario_set(
          {
            project_id: project_id,
            name: `TS-SDK Testing Generated Scenario ${random_string}`,
            source_scenario_id: sData.scenario_id,
            number_examples: 2,
          }
        )
        expect(data).toBeDefined();
      });


      test('Get Scenario Datapoints', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const sData: any = await okareo.create_scenario_set(
          {
            name: "TS-SDK SEED Data",
            project_id: project_id,
            seed_data: TEST_SEED_DATA
          }
        );
        const data: any = await okareo.get_scenario_data_points(sData.scenario_id);
        expect(data).toBeDefined();
      });


});


/*
it('Upload Scenario Set', async () =>  {
  const okareo = new Okareo({api_key:OKAREO_API_KEY});
  const pData: any[] = await okareo.getProjects();
  const data: any = await okareo.upload_scenario_set(
    {
      file_path: "test_data/seed_data.jsonl",
      scenario_name: "TS-SDK Testing Scenario Set",
      project_id: project_id
    }
  );
  expect(data).toBeDefined();
});
*/
