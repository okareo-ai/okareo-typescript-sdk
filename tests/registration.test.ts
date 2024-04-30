import { Okareo } from '../dist';
import {ModelUnderTest, OpenAIModel, CohereModel, CustomModel } from "../dist";
import { getProjectId } from './setup-env';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const UNIQUE_BUILD_ID = (process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
let project_id: string;


describe('Scenarios', () => {
  beforeAll(async () => {
    project_id = await getProjectId();
  });
  
  test('Register Models', async () =>  {
    const okareo = new Okareo({api_key:OKAREO_API_KEY});
    const MODEL_TEST_KEY = "test_key";

    const openai_model = await okareo.register_model(
      ModelUnderTest({
        name: `CI: Register OpenAI ${UNIQUE_BUILD_ID}`,
        tags: [],
        project_id: project_id,
        model: OpenAIModel({
          model_id:"dummy",
          temperature:0.5,
          system_prompt_template:"dummy",
          user_prompt_template:"dummy"
        })
      })
    );
    expect(openai_model).toBeDefined();
    expect(openai_model.models?.['openai']?.api_keys).toBeUndefined();

    const cohere_model = await okareo.register_model(
        ModelUnderTest({
          name: `CI: Register Cohere ${UNIQUE_BUILD_ID}`,
          tags: [],
          project_id: project_id,
          model: CohereModel({
            model_id:"dummy",
            model_type:"classify"
          })
        })
      );
      expect(cohere_model).toBeDefined();
      expect(cohere_model.models?.['cohere']?.api_key).toBeUndefined();

      const custom_model = await okareo.register_model(
        ModelUnderTest({
          name: `CI: Register Custom ${UNIQUE_BUILD_ID}`,
          tags: [],
          project_id: project_id,
          model: CustomModel({
            invoke: async (input: string, result: string) => { 
                return {
                    actual: "noop",
                    model_response: {}
                }
            }
        })
        })
      );
      expect(custom_model).toBeDefined();
      expect(custom_model.models?.['custom']?.invoke).toBeUndefined();

  });

});
