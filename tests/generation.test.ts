import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
    CheckCreateUpdateProps,
    CheckOutputType,
    GenerationModel,
    Okareo,
    TestRunType,
    RunTestProps,
    OpenAIModel,
} from "../src";
import { getProjectId } from "./utils/setup-env";
import { uniqueName } from "./utils/test-utils";

// 👇 ES module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";
let project_id: string;

const SYSTEM_PROMPT: string = `You will get some a long passage of text.  As an expert at distilling information to the most basic results, provide a short one sentence summary of the provided material.`;
const USER_PROMPT: string = `{scenario_input}`;

describe("Evaluations", () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    test("Generation", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const upload_scenario: any = await okareo.upload_scenario_set({
            scenario_name: uniqueName("CI: Upload WebBizz Scenario Generation"),
            file_path: "./tests/fixtures/generation-scenario.jsonl",
            project_id,
        });

        const model = await okareo.register_model({
            name: uniqueName("CI: Generation"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            models: [
                {
                    type: "openai",
                    model_id: "gpt-3.5-turbo",
                    temperature: 0.5,
                    system_prompt_template: SYSTEM_PROMPT,
                    user_prompt_template: USER_PROMPT,
                } as OpenAIModel,
            ],
            update: true,
        });

        const data = await model.run_test({
            model_api_key: OPENAI_API_KEY,
            name: uniqueName("CI: Custom Test Run"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            scenario: upload_scenario,
            calculate_metrics: true,
            type: TestRunType.NL_GENERATION,
            checks: ["consistency_summary", "relevance_summary"],
        } as RunTestProps);

        expect(data).toBeDefined();
    });

    test("Generation w/ tools", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const upload_scenario: any = await okareo.upload_scenario_set({
            scenario_name: uniqueName("CI: Upload WebBizz Scenario Tools"),
            file_path: "./tests/fixtures/generation-scenario.jsonl",
            project_id,
        });

        // ✅ Fixed path resolution for ESM
        const filePath = join(__dirname, "fixtures", "example_eval.py");
        const code_contents = readFileSync(filePath, "utf8");
        const check_config = {
            code_contents,
            type: CheckOutputType.PASS_FAIL,
        };
        const check_info = {
            project_id,
            name: uniqueName("CI: Uploaded Code-based Check"),
            description: "Pass if the model result length is within 10% of the expected result.",
            check_config,
        } as CheckCreateUpdateProps;

        await okareo.create_or_update_check(check_info);

        const model = await okareo.register_model({
            name: uniqueName("CI: Generation"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            models: [
                {
                    type: "openai",
                    model_id: "gpt-3.5-turbo",
                    temperature: 0.5,
                    system_prompt_template: "Get the current weather for sf ca",
                    user_prompt_template: "Get the current weather for sf ca",
                    tools: [
                        {
                            type: "function",
                            function: {
                                name: "get_current_weather",
                                description: "Get the current weather in a given location",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        location: {
                                            type: "string",
                                            description: "The city and state, e.g. San Francisco, CA",
                                        },
                                        unit: {
                                            type: "string",
                                            enum: ["celsius", "fahrenheit"],
                                        },
                                    },
                                    required: ["location"],
                                },
                            },
                        },
                    ],
                } as OpenAIModel,
            ],
            update: true,
        });

        const data: any = await model.run_test({
            model_api_key: OPENAI_API_KEY,
            name: uniqueName("CI: Custom Test Run"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            scenario: upload_scenario,
            calculate_metrics: true,
            type: TestRunType.NL_GENERATION,
            checks: [check_info.name],
        } as RunTestProps);

        expect(data).toBeDefined();
    });

    test("Generation LiteLLM", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const upload_scenario: any = await okareo.upload_scenario_set({
            scenario_name: uniqueName("CI: Upload WebBizz Scenario LiteLLM"),
            file_path: "./tests/fixtures/generation-scenario.jsonl",
            project_id: project_id,
        });

        const model = await okareo.register_model({
            name: uniqueName("CI: Generation"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            models: [
                {
                    type: "generation",
                    model_id: "gpt-3.5-turbo",
                    temperature: 0.5,
                    system_prompt_template: SYSTEM_PROMPT,
                    user_prompt_template: USER_PROMPT,
                } as GenerationModel,
            ],
            update: true,
        });

        const data = await model.run_test({
            model_api_key: OPENAI_API_KEY,
            name: uniqueName("CI: Custom Test Run"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            scenario: upload_scenario,
            calculate_metrics: true,
            type: TestRunType.NL_GENERATION,
            checks: ["consistency_summary", "relevance_summary"],
        } as RunTestProps);

        expect(data).toBeDefined();
    });
});
