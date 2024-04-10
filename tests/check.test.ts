import { Okareo, RunTestProps, OpenAIModel, SeedData, ModelUnderTest } from "../dist";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";
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

describe('Checks', () => {

    test('Create a Check', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === "Global")?.id;
        const random_string = (Math.random() + 1).toString(36).substring(7);
        
        const check_info = {
            name: `test.check.${random_string}`,
            project_id,
            description: "Return a pass if the model output is the phrase 'Technical Support' otherwise fail.",
            requires_scenario_input: true,
            requires_scenario_result: true,
            output_data_type: "boolean",
        }

        const check: any = await okareo.generate_evaluator(check_info);
        let upload_check = await okareo.upload_evaluator({
            ...check_info,
            generated_code: check.generated_code,
        });
        upload_check = await okareo.upload_evaluator({
            ...check_info,
            generated_code: check.generated_code,
            update: true,
        });
        let sData: any = await okareo.create_scenario_set({
            name: `test.check_scenario.${random_string}`,
            project_id: project_id,
            seed_data: TEST_SEED_DATA
        });

        await okareo.register_model(
            ModelUnderTest({
                name: `test.check_model.${random_string}`,
                tags: ["TS-SDK", "Testing", `${random_string}`],
                project_id: project_id,
                model: OpenAIModel({
                    api_key: OPENAI_API_KEY,
                    model_id:"gpt-3.5-turbo",
                    temperature:0.5,
                    system_prompt_template:`
                        Only respond with the most appropriate response from the following:
                        Technical Support
                        Billing
                        Account Management
                        General Inquiry
                    `,
                    user_prompt_template:"{input}"
                }),
            })
        );
        const run_result: any = await okareo.run_test({
            project_id: project_id,
            scenario_id: sData.scenario_id,
            name: `test.check_run.${random_string}`,
            calculate_metrics: true,
            type: "NL_GENERATION",
            checks: [upload_check.id],
        } as RunTestProps);
        
        expect(run_result).toBeDefined();
    });

});




