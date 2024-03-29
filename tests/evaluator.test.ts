import { Okareo } from '../dist';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OKAREO_BASE_URL = process.env.OKAREO_BASE_URL || "https://api.okareo.com/";

describe('Evaluators', () => {
    
    it('Generate Evaluator', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
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
        const genData: any = await okareo.generate_evaluator(genConfig);
        const { generated_code } = genData;
        console.log(generated_code);
        const data: any = await okareo.upload_evaluator(
          {
            project_id: genConfig.project_id,
            name: "Question Detector Test",
            description: genConfig.description,
            evaluator_code: generated_code,
            requires_scenario_input: genConfig.requires_scenario_input,
            requires_scenario_result: genConfig.requires_scenario_result,
            output_data_type: "boolean"
          }
        );
        console.log(JSON.stringify(data));
        expect(data).toBeDefined();

    });


    it('Upload Evaluator', async () =>  {
      const okareo = new Okareo({api_key:OKAREO_API_KEY });
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
      const data: any = await okareo.upload_evaluator(
        {
          project_id: genConfig.project_id,
          name: "Question Detector Test",
          description: genConfig.description,
          file_path: "./tests/example_eval.py",
          requires_scenario_input: genConfig.requires_scenario_input,
          requires_scenario_result: genConfig.requires_scenario_result,
          output_data_type: "boolean"
        }
      );
      
      expect(data).toBeDefined();

  });

});

