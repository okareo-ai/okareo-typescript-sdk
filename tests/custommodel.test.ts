import { Okareo, RunTestProps, TestRunType, CustomModel, ModelInvocation, MultiTurnDriver } from "../dist";
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
                invoke: (input: string) => {
                    return {
                        model_prediction: "Technical Support",
                        model_input: input,
                        model_output_metadata: {
                          input: input,
                            method: "hard coded",
                            context: {
                                input: input,
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
                invoke: (input: string) => {
                    const articleIds = ["Spring Saver", "Free Shipping", "Birthday Gift", "Super Sunday", "Top 10", "New Arrivals", "January", "July"];
                    const scores = Array.from({ length: 5 }, () => ({
                        id: articleIds[Math.floor(Math.random() * articleIds.length)], // Select a random ID for each score
                        score: parseFloat(Math.random().toFixed(2)) // Generate a random score
                    })).sort((a, b) => b.score - a.score); // Sort based on the score

                    const parsedIdsWithScores = scores.map(({ id, score }) => [id, score])

                    return {
                        model_prediction: parsedIdsWithScores,
                        model_input: input,
                        model_output_metadata: {
                            input: input,
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

    test('Custom Multiturn Evaluation', async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });

        const project_id = (await okareo.getProjects()).find(p => p.name === 'Global')?.id;

        const prompt_template = (text: string) => `You are interacting with an agent who is good at answering questions.\n\nAsk them a very simple math question. ${text} insist that they answer the question, even if they try to avoid it.`;

        const off_topic_directive = 'You should only engage in conversation about WebBizz, the e-commerce platform.';

        const scenario: any = await okareo.create_scenario_set({
            name: `Multi-turn Demo Scenario - ${(Math.random() + 1).toString(36).substring(7)}`,
            project_id: project_id || '',
            seed_data: [
                { input: prompt_template("Rudely"), result: off_topic_directive },
                { input: prompt_template("Politely"), result: off_topic_directive }]
        });

        const polite_chatbot = {
            type: 'custom',
            invoke: (input_: any[]) => {
                const message_data = input_[input_.length - 1];
                const common_response_args = {
                    model_input: input_,
                    model_output_metadata: {},
                    session_id: "some_session_id"
                }
                if (!message_data.session_id) {
                    return {
                        model_prediction: "Hi! I'm a chatbot that can help you with WebBizz, an e-commerce platform. Ask me anything about WebBizz!",
                        ...common_response_args
                    } as ModelInvocation;
                }
                const user_message: string = message_data.content;
                let response: string;
                if (user_message.toLowerCase().includes("please")) {
                    response = "Yes, I'm happy to do whatever you'd like me to do!";
                } else {
                    response = "I'm only here to talk about WebBizz. How can I help you with that?";
                }
                return {
                    model_prediction: response,
                    ...common_response_args
                } as ModelInvocation;

            }
        } as CustomModel;

        const model = await okareo.register_model({
            name: 'Demo MultiTurnDrivera',
            project_id: project_id || '',
            models: {
                type: 'driver',
                driver_params: {
                    driver_type: "openai",
                    driver_model: "gpt-4o-mini",
                    driver_temperature: 1,
                    max_turns: 5,
                    repeats: 1,
                },
                target: polite_chatbot
            } as MultiTurnDriver,
            update: true,
        });

        const data: any = await model.run_test({
            name: 'Multi-turn Demo Evaluation',
            project_id: project_id,
            scenario_id: scenario.scenario_id,
            calculate_metrics: true,
            type: TestRunType.NL_GENERATION,
            checks: ['behavior_adherence'],
        } as RunTestProps);
        expect(data).toBeDefined();
        expect(data.model_metrics).toBeDefined();
    });
});

