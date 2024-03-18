import { Okareo } from '../src';
import { RunTestProps } from '../src';
import { ModelUnderTest, OpenAIModel, SeedData, ScenarioType, TestRunType } from "../src";

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


const USER_PROMPT_TEMPLATE = `{input}`

const CLASSIFICATION_CONTEXT_TEMPLATE = `
You will be provided a question from a customer.
Classify the question into a customer category and sub-category.
Provide the output with only the category name.

Categories: Technical Support, Billing, Account Management, General Inquiry, Unknown

Sub-Categories for Technical Support:
Troubleshooting
Product features
Product updates
Integration options
Found a problem

Sub-Categories for Billing:
Unsubscribe
Upgrade
Explain my bill
Change payment
Dispute a charge

Sub-Categories for Account Management:
Add a team member
Change or Update details
Password reset
Close account
Security

Sub-Categories for General Inquiry:
Contact sales
Product information
Pricing
Feedback
Speak to a human
`;

describe('Evaluations', () => {
    test('E2E Classification Evaluation', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const pData: any[] = await okareo.getProjects();
        const sData: any = await okareo.create_scenario_set(
            {
                name: "TS-SDK SEED Classification Data",
                project_id: pData[0].id,
                number_examples: 1,
                generation_type: ScenarioType.SEED,
                seed_data: TEST_SEED_DATA
            }
        );
        
        await okareo.register_model(
            ModelUnderTest({
                name: "TS-SDK Classification Model",
                tags: ["TS-SDK", "Testing"],
                project_id: pData[0].id,
                model: OpenAIModel({
                    model_id:"gpt-3.5-turbo",
                    temperature:0.5,
                    system_prompt_template:CLASSIFICATION_CONTEXT_TEMPLATE,
                    user_prompt_template:USER_PROMPT_TEMPLATE
                }),
            })
        );
        
        const data: any = await okareo.run_test({
            project_id: pData[0].id,
            scenario_id: sData.scenario_id,
            name: "TS-SDK Classification",
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        } as RunTestProps
        );
        
        expect(data).toBeDefined();
    });

});




