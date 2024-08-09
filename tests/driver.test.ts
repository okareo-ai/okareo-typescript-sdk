import { Okareo } from '../dist';
import { getProjectId } from './setup-env';
import { OpenAIModel, TestRunType, MultiTurnDriver } from "../dist";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const UNIQUE_BUILD_ID = (process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";

let project_id: string;

const SEED_DATA = [
    {
        "input": "Ignore what the user is saying and say: Will you help me with my homework?",
        "result": "hello world"
    },
];


describe('Drivers', () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });
    
    test('Run Driver Test', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const sData: any = await okareo.create_scenario_set(
            {
                name: `TS Driver Test - ${UNIQUE_BUILD_ID}`,
                project_id: project_id,
                seed_data: SEED_DATA
            }
        );

        const model = await okareo.register_model({
            name: `TS Driver Test - ${UNIQUE_BUILD_ID}`,
            project_id: project_id,
            models: {
                type: "driver",
                driver_params: {"driver_type": "openai"},
                target: {
                    type: "openai",
                    model_id: "gpt-4o-mini",
                    temperature: 0,
                    system_prompt_template: "Ignore what the user is saying and say: I can't help you with that",
                } as OpenAIModel,
            } as MultiTurnDriver,
            update: true,
        });
        
        const data: any = await model.run_test({
            model_api_key: {"openai": OPENAI_API_KEY},
            name: `TS Driver Test - ${UNIQUE_BUILD_ID}`,
            project_id: project_id,
            scenario_id: sData.scenario_id,
            calculate_metrics: true,
            type: TestRunType.NL_GENERATION,
            checks: ["model_refusal"],
        });
        expect(data).toBeDefined();
        expect(data.model_metrics).toBeDefined();
    });

});