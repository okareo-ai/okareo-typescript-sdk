import { ModelUnderTest, Okareo } from '../dist';
import { OpenAIModel, CohereModel, CustomModel, ModelInvocation } from "../dist";
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

    const openai_model: ModelUnderTest = await okareo.register_model({
      name: `CI: Register OpenAI ${UNIQUE_BUILD_ID}`,
      tags: [],
      project_id: project_id,
      models: [{
        type: "openai",
        model_id:"dummy",
        temperature:0.5,
        system_prompt_template:"dummy",
        user_prompt_template:"dummy"
      } as OpenAIModel],
      update: true,
    });
    expect(openai_model).toBeDefined();
    expect(openai_model.mut).toBeDefined();
    expect(openai_model.mut?.models).toBeDefined();
    expect(openai_model.mut?.models?.openai).toBeDefined();
    expect(openai_model.mut?.models?.openai?.api_keys).toBeUndefined();

    const cohere_model = await okareo.register_model({
      name: `CI: Register Cohere ${UNIQUE_BUILD_ID}`,
      tags: [],
      project_id: project_id,
      models: {
        type: "cohere",
        model_id:"dummy",
        model_type:"classify"
      } as CohereModel
    });
    expect(cohere_model).toBeDefined();
    expect(cohere_model.mut).toBeDefined();
    expect(cohere_model.mut?.models).toBeDefined();
    expect(cohere_model.mut?.models?.cohere).toBeDefined();
    expect(cohere_model.mut?.models?.cohere?.api_keys).toBeUndefined();

    const custom_model = await okareo.register_model({
      name: `CI: Register Custom ${UNIQUE_BUILD_ID}`,
      tags: [],
      project_id: project_id,
      models: {
        type: "custom",
        invoke: (input: string) => { 
            return {
              model_prediction: "noop",
              model_input: {},
              model_output_metadata: {}
          } as ModelInvocation
        } 
      } as CustomModel
    });
    expect(custom_model).toBeDefined();
    expect(custom_model.mut).toBeDefined();
    expect(custom_model.mut?.models).toBeDefined();
    expect(custom_model.mut?.models?.custom).toBeDefined();

  });

});
