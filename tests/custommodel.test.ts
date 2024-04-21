import { Okareo, RunTestProps, components, SeedData, TestRunType, ModelUnderTest, CustomModel, TCustomModelResponse } from "../dist";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";

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
    test('Custom Endpoint Evaluation', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const sData: any = await okareo.create_scenario_set(
            {
            name: "TS-SDK Testing Scenario Set",
            project_id: project_id,
            seed_data: TEST_SEED_DATA
            }
        );
        
        await okareo.register_model(
            ModelUnderTest({
                name: "TS-SDK Custom Model",
                tags: ["TS-SDK", "Custom", "Testing"],
                project_id: project_id,
                model: CustomModel({
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
                }),
            })
        );
        
        const data: any = await okareo.run_test({
                project_id: project_id,
                //scenario_id: sData.scenario_id,
                scenario: sData,
                name: "TS-SDK Custom Run",
                calculate_metrics: true,
                type: TestRunType.MULTI_CLASS_CLASSIFICATION,
            } as RunTestProps
        );
        
        expect(data).toBeDefined();
    });

});




