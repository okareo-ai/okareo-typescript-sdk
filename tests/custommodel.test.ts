import { Okareo, RunTestProps, components, SeedData, TestRunType, ModelUnderTest, CustomModel, RegisterModelProps } from "../dist";
import { getProjectId } from './setup-env';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const UNIQUE_BUILD_ID = (process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
let project_id: string;

const TEST_SEED_DATA = [
    SeedData({
        input:"Can I connect to my SalesForce?",  
        result:"Technical Support"
    }),
    SeedData({
        input:"Do you have a way to send marketing emails?",  
        result:"Technical Support"
    }),
    SeedData({
        input:"Can I get invoiced instead of using a credit card?", 
        result:"Billing"
    }),
    SeedData({
        input:"My CRM integration is not working.", 
        result:"Technical Support"
    }),
    SeedData({
        input:"Do you have SOC II tpye 2 certification?", 
        result:"Account Management"
    }),
    SeedData({
        input:"I like the product.  Please connect me to your enterprise team.", 
        result:"General Inquiry"
    })
];

describe('Evaluations', () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    test('Custom Evaluation', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const sData: any = await okareo.create_scenario_set({
            name: "CI Custom Model Test Data",
            project_id: project_id,
            seed_data: TEST_SEED_DATA
        });
        
        const model = await okareo.register_model({
                name: "CI Custom Model",
                tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
                project_id: project_id,
                models: {
                    type: "custom",
                    invoke: async (input: string, result: string) => { 
                        return {
                            actual: "Technical Support",
                            model_response: {
                                input: input,
                                method: "hard coded",
                                context: {
                                    input: input,
                                    result: result,
                                },
                            }
                        }
                    }
                } as CustomModel,
                update: true,
            }
        );
        
        const data: any = await model.run_test({
            name: `CI: Custom Test Run ${UNIQUE_BUILD_ID}`,
            tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            scenario: sData,
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        } as RunTestProps);
        
        expect(data).toBeDefined();
    });

});




