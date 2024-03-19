import { Okareo } from '../src';
import { RunTestProps } from '../src';
import { components, SeedData, TestRunType, ModelUnderTest, CustomModel, TCustomModelResponse } from "../src";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OKAREO_BASE_URL = process.env.OKAREO_BASE_URL || "https://api.okareo.com/";
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
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const pData: any[] = await okareo.getProjects();
        const sData: any = await okareo.create_scenario_set(
            {
            name: "TS-SDK Testing Scenario Set",
            project_id: pData[0].id,
            number_examples: 1,
            generation_type: "SEED",
            seed_data: TEST_SEED_DATA
            }
        );
        
        await okareo.register_model(
            ModelUnderTest({
                name: "TS-SDK Custom Model",
                tags: ["TS-SDK", "Custom", "Testing"],
                project_id: pData[0].id,
                model: CustomModel({
                    invoke: (input: string) => { 
                        return "Technical Support";
                    }
                }),
            })
        );
        
        const data: any = await okareo.run_test({
                project_id: pData[0].id,
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



