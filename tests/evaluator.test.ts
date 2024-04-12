import { Okareo } from '../dist';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OKAREO_BASE_URL = process.env.OKAREO_BASE_URL || "https://api.okareo.com/";

describe('Evaluators', () => {

  it('Generate Evaluator', async () =>  {
    const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL });
    const pData: any[] = await okareo.getProjects();
    const project_id = pData.find(p => p.name === "Global")?.id;
    const genConfig = {
      project_id: project_id,
      description: "In Python, write a script that returns True if the input is a question and False otherwise.",
      requires_scenario_input: true,
      requires_scenario_result: false,
      output_data_type: "boolean",
    }
    const genData: any = await okareo.generate_check(genConfig);
    const { generated_code } = genData;
    
    const data: any = await okareo.upload_check(
      {
        project_id: genConfig.project_id,
        name: "Question Detector NEW",
        description: genConfig.description,
        generated_code: generated_code,
        requires_scenario_input: genConfig.requires_scenario_input,
        requires_scenario_result: genConfig.requires_scenario_result,
        output_data_type: "boolean"
      }
    );
    console.log("data",JSON.stringify(data));
    expect(data).toBeDefined();

    const delData = await okareo.delete_check(data.id, data.name);
    expect(delData).toEqual("Check deletion was successful");
  });

  it('Upload Evaluator', async () =>  {
    const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL });
    const pData: any[] = await okareo.getProjects();
    const project_id = pData.find(p => p.name === "Global")?.id;

    const genConfig = {
      project_id: project_id,
      //description: "Determine if the input is a question and return true.  Write the code in python.",
      description: "The output should be a float which represents the non-whitespace characters in the model output divided by the non-whitespace characters of the scenario input",
      requires_scenario_input: true,
      requires_scenario_result: false,
      output_data_type: "boolean",
    }
    const data: any = await okareo.upload_check(
      {
        project_id: genConfig.project_id,
        name: "Question Detector ALT",
        description: genConfig.description,
        file_path: "./tests/example_eval.py",
        requires_scenario_input: genConfig.requires_scenario_input,
        requires_scenario_result: genConfig.requires_scenario_result,
        output_data_type: "boolean"
      }
    );
    expect(data).toBeDefined();

    const delData = await okareo.delete_check(data.id, data.name);
    expect(delData).toEqual("Check deletion was successful");
  });

  it('Get All Evaluators', async () =>  {
    const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL });
    const pData: any[] = await okareo.getProjects();
    const project_id = pData.find(p => p.name === "Global")?.id;
    const allEvals = await okareo.get_all_checks();
    expect(allEvals).toBeDefined();
  });

  it('Get Individual Evaluator', async () =>  {
    const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL });
    const pData: any[] = await okareo.getProjects();
    const project_id = pData.find(p => p.name === "Global")?.id;
    const allEvals = await okareo.get_all_checks();
    let evalObj;
    if (allEvals.length > 0) {
      const eval_id = allEvals[0].id;
      evalObj = (eval_id)?await okareo.get_check(eval_id):null;
    }
    expect(evalObj).toBeDefined();
  });

});

