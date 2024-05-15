import { Okareo, RunTestProps, components, SeedData, TestRunType, CustomModel, RegisterModelProps, ModelInvocation } from "../dist";
import { getProjectId } from './setup-env';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const UNIQUE_BUILD_ID = (process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
let project_id: string;

const TEST_SEED_DATA = [
    {
        "input": "Can I connect to my SalesForce?",  
        "result": "Technical Support"
    },
    {
        "input": "Do you have a way to send marketing emails?",  
        "result": "Technical Support"
    },
    {
        "input": "Can I get invoiced instead of using a credit card?", 
        "result": "Billing"
    },
    {
        "input": "My CRM integration is not working.", 
        "result": "Technical Support"
    },
    {
        "input": "Do you have SOC II type 2 certification?", 
        "result": "Account Management"
    },
    {
        "input": "I like the product. Please connect me to your enterprise team.", 
        "result": "General Inquiry"
    }
];

const TEST_IR_DATA = [
    {
        "input": "What are top WebBizz Rewards loyalty programs?",
        "result": ["Spring Saver", "Free Shipping", "Birthday Gift"]
    },
    {
        "input": "What are WebBizz most popular collections?",
        "result": ["Super Sunday", "Top 10", "New Arrivals"]
    },
    {
        "input": "Which are biggest savings months for WebBizz?",
        "result": ["January", "July"]
    }
];


describe('Evaluations', () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    test('Custom Classification Evaluation', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const sData: any = await okareo.create_scenario_set({
            name: "CI Custom Classification Model Test Data",
            project_id: project_id,
            seed_data: TEST_SEED_DATA
        });
        
        const model = await okareo.register_model({
            name: "CI Custom Classification Model",
            tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            models: {
                type: "custom",
                invoke: (input: string, result: string) => {
                    return {
                        actual: "Technical Support",
                        model_input: input,
                        model_result: {
                            input: input,
                            method: "hard coded",
                            context: {
                                input: input,
                                result: result,
                            }
                        }
                    } as ModelInvocation
                }
            } as CustomModel,
            update: true,
        }
        );
        
        const data: any = await model.run_test({
            name: `CI: Custom Classification Test Run ${UNIQUE_BUILD_ID}`,
            tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            scenario: sData,
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        } as RunTestProps);
        
        expect(data).toBeDefined();
        expect(data.model_metrics).toBeDefined();

    });

    test('Custom Retrieval Evaluation', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const sData: any = await okareo.create_scenario_set({
            name: "CI Custom Retrieval Model Test Data",
            project_id: project_id,
            seed_data: TEST_IR_DATA
        });

        const model = await okareo.register_model({
            name: "CI Custom Retrieval Model",
            tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            models: {
                type: "custom",
                invoke: (input: string, result: string) => {
                    const articleIds = ["Spring Saver", "Free Shipping", "Birthday Gift", "Super Sunday", "Top 10", "New Arrivals", "January", "July"];
                    const scores = Array.from({length: 5}, () => ({
                        id: articleIds[Math.floor(Math.random() * articleIds.length)], // Select a random ID for each score
                        score: parseFloat(Math.random().toFixed(2)) // Generate a random score
                    })).sort((a, b) => b.score - a.score); // Sort based on the score
        
                    const parsedIdsWithScores = scores.map(({ id, score }) => [id, score])
                            
                    return {
                        actual: parsedIdsWithScores,
                        model_input: input,
                        model_result: {
                            input: input,
                            result: result,
                        }
                    } as ModelInvocation
                }
            } as CustomModel,
            update: true,
        });
        
        
        const data: any = await model.run_test({
            name: `CI: Custom Retrieval Test Run ${UNIQUE_BUILD_ID}`,
            tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            scenario: sData,
            calculate_metrics: true,
            type: TestRunType.INFORMATION_RETRIEVAL,
        } as RunTestProps);
        
        expect(data).toBeDefined();
        expect(data.model_metrics).toBeDefined();

    });

});




