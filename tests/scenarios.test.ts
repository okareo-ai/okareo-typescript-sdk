import { Okareo } from '../dist';
import { getProjectId } from './setup-env';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const UNIQUE_BUILD_ID = (process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
let project_id: string;

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

describe('Scenarios', () => {
  beforeAll(async () => {
    project_id = await getProjectId();
  });

  test('Create New Scenario Seed', async () =>  {
      const okareo = new Okareo({api_key:OKAREO_API_KEY});
      const data: any = await okareo.create_scenario_set({
          name: `CI: Scenario Seed ${UNIQUE_BUILD_ID}`,
          project_id: project_id,
          seed_data: TEST_SEED_DATA
      });
      expect(data).toBeDefined();
  });

  test('Generate Scenario Set From Existing Scenario', async () =>  {
      const okareo = new Okareo({api_key:OKAREO_API_KEY});
      const sData: any = await okareo.create_scenario_set({
        name: `CI: Scenario Prepare Generation ${UNIQUE_BUILD_ID}`,
        project_id: project_id,
        seed_data: TEST_SEED_DATA
      });
    const data: any = await okareo.generate_scenario_set({
      name: `CI: Scenario Generate ${UNIQUE_BUILD_ID}`,
      project_id: project_id,
      source_scenario_id: sData.scenario_id,
      number_examples: 2,
    });
    expect(data).toBeDefined();

    // verify meta_data['seed_id'] is present for each generated data point
    const seed_datapoints: any = await okareo.get_scenario_data_points(sData.scenario_id);
    const seed_ids: string[] = seed_datapoints.map((dp: any) => dp.id);
    const datapoints: any = await okareo.get_scenario_data_points(data.scenario_id);
    expect(datapoints.length).toBeGreaterThan(0);
    datapoints.forEach(
      (dp: any) => {
        expect(dp.meta_data['seed_id']).toBeDefined();
        expect(seed_ids).toContain(dp.meta_data['seed_id']);
      }
    )
    
  });

    
  test('Upload Scenario Set', async () =>  {
    const okareo = new Okareo({api_key:OKAREO_API_KEY});
    
    const data: any = await okareo.upload_scenario_set(
      {
        name: `CI: Scenario Upload ${UNIQUE_BUILD_ID}`,
        file_path: "./tests/upload_file.jsonl",
        project_id: project_id
      }
    );
    
    expect(data.app_link).toBeDefined();

  });

  test('Get Scenario Datapoints', async () =>  {
    const okareo = new Okareo({api_key:OKAREO_API_KEY});
    const sData: any = await okareo.create_scenario_set({
      name: `CI: Scenario Prepare Generation ${UNIQUE_BUILD_ID}`,
      project_id: project_id,
      seed_data: TEST_SEED_DATA
    });
    const datapoints: any = await okareo.get_scenario_data_points(sData.scenario_id);
    expect(datapoints.length).toBeGreaterThan(0);
  });


});
