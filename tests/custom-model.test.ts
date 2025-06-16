import { Okareo, RunTestProps, TestRunType, CustomModel, ModelInvocation } from "../src";
import { getProjectId } from "./utils/setup-env";
import { uniqueName } from "./utils/test-utils";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
let project_id: string;

const TEST_SEED_DATA = [
    {
        input: "Can I connect to my SalesForce?",
        result: "Technical Support",
    },
    {
        input: "Do you have a way to send marketing emails?",
        result: "Technical Support",
    },
    {
        input: "Can I get invoiced instead of using a credit card?",
        result: "Billing",
    },
    {
        input: "My CRM integration is not working.",
        result: "Technical Support",
    },
    {
        input: "Do you have SOC II type 2 certification?",
        result: "Account Management",
    },
    {
        input: "I like the product. Please connect me to your enterprise team.",
        result: "General Inquiry",
    },
];

const TEST_IR_DATA = [
    {
        input: "What are top WebBizz Rewards loyalty programs?",
        result: ["Spring Saver", "Free Shipping", "Birthday Gift"],
    },
    {
        input: "What are WebBizz most popular collections?",
        result: ["Super Sunday", "Top 10", "New Arrivals"],
    },
    {
        input: "Which are biggest savings months for WebBizz?",
        result: ["January", "July"],
    },
];

describe("Evaluations", () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    test("Custom Classification Evaluation", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const sData: any = await okareo.create_scenario_set({
            name: uniqueName("CI Custom Classification Model Test Data"),
            project_id: project_id,
            seed_data: TEST_SEED_DATA,
        });

        const model = await okareo.register_model({
            name: uniqueName("CI Custom Classification Model"),
            tags: ["TS-SDK", "CI", "Testing"],
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
                            },
                        },
                    } as ModelInvocation;
                },
            } as CustomModel,
            update: true,
        });

        const data: any = await model.run_test({
            name: uniqueName("CI: Custom Classification Test Run"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id: project_id,
            scenario: sData,
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        } as RunTestProps);

        expect(data).toBeDefined();
        expect(data.model_metrics).toBeDefined();
    });

    test("Custom Retrieval Evaluation", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const sData: any = await okareo.create_scenario_set({
            name: uniqueName("CI Custom Retrieval Model Test Data"),
            project_id,
            seed_data: TEST_IR_DATA,
        });

        const model = await okareo.register_model({
            name: uniqueName("CI Custom Retrieval Model"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id: project_id,
            models: {
                type: "custom",
                invoke: (input: string) => {
                    const articleIds = [
                        "Spring Saver",
                        "Free Shipping",
                        "Birthday Gift",
                        "Super Sunday",
                        "Top 10",
                        "New Arrivals",
                        "January",
                        "July",
                    ];
                    const scores = Array.from({ length: 5 }, () => ({
                        id: articleIds[Math.floor(Math.random() * articleIds.length)], // Select a random ID for each score
                        score: parseFloat(Math.random().toFixed(2)), // Generate a random score
                    })).sort((a, b) => b.score - a.score); // Sort based on the score

                    const parsedIdsWithScores = scores.map(({ id, score }) => [id, score]);

                    return {
                        model_prediction: parsedIdsWithScores,
                        model_input: input,
                        model_output_metadata: {
                            input: input,
                        },
                    } as ModelInvocation;
                },
            } as CustomModel,
            update: true,
        });

        const data: any = await model.run_test({
            name: uniqueName("CI: Custom Retrieval Test Run"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id: project_id,
            scenario: sData,
            calculate_metrics: true,
            type: TestRunType.INFORMATION_RETRIEVAL,
        } as RunTestProps);

        expect(data).toBeDefined();
        expect(data.model_metrics).toBeDefined();
    });

    test("Custom Function Call Evaluation", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });

        const seed_data = [
            {
                input: "can you delete my account? my name is Bob",
                result: {
                    name: "delete_account",
                    parameter_definitions: { username: { value: "Bob", type: "str", required: true } },
                },
            },
            {
                input: "how do I make an account? I'm Alice",
                result: {
                    name: "create_account",
                    parameter_definitions: { username: { value: "Alice", type: "str", required: true } },
                },
            },
            {
                input: "how do I create an account?",
                result: {
                    name: "create_account",
                    parameter_definitions: { username: { value: "Alice", type: "str", required: true } },
                },
            },
            {
                input: "my name is John. how do I create a project?",
                result: {
                    name: "create_account",
                    parameter_definitions: { username: { value: "Alice", type: "str", required: true } },
                },
            },
        ];

        const scenario: any = await okareo.create_scenario_set({
            name: uniqueName("Function Call Demo Scenario"),
            project_id,
            seed_data,
        });

        const function_call_model = {
            type: "custom",
            invoke: async (input_value) => {
                const usernames = ["Alice", "Bob", "Charlie"];
                const out: { tool_calls: { name: string; parameters: { [key: string]: any } }[] } = { tool_calls: [] };
                const tool_call: { name: string; parameters: { [key: string]: any } } = {
                    name: "unknown",
                    parameters: {},
                };
                if (input_value.includes("delete")) {
                    tool_call.name = "delete_account";
                }
                if (input_value.includes("create")) {
                    tool_call.name = "create_account";
                }
                for (const username of usernames) {
                    if (input_value.includes(username)) {
                        tool_call.parameters["username"] = username;
                        break;
                    }
                }
                out.tool_calls.push(tool_call);
                return {
                    model_prediction: out,
                    model_input: input_value,
                    model_output_metadata: {},
                };
            },
        } as CustomModel;

        const model = await okareo.register_model({
            name: uniqueName("Function Call Demo Model"),
            project_id,
            models: function_call_model,
            update: true,
        });

        const data = await model.run_test({
            name: uniqueName("Function Call Demo Evaluation"),
            project_id,
            scenario_id: scenario.scenario_id,
            calculate_metrics: true,
            type: TestRunType.NL_GENERATION,
            checks: [
                "is_function_correct",
                "are_required_params_present",
                "are_all_params_expected",
                "do_param_values_match",
            ],
        } as RunTestProps);
        expect(data).toBeDefined();
        expect(data.model_metrics).toBeDefined();
    });
});
