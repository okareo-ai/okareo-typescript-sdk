import { Okareo, RunTestProps, DatapointSearch, OpenAIModel, TestRunType } from "../src";
import { getProjectId } from "./utils/setup-env";
import { uniqueName } from "./utils/test-utils";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";

const SYSTEM_PROMPT: string = `You will get some a long passage of text.  As an expert at distilling information to the most basic results, provide a short one sentence summary of the provided material.`;
const USER_PROMPT: string = `{scenario_input}`;

let model: any;
let project_id: string;

describe("Model Interactions", () => {
    beforeAll(async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        project_id = await getProjectId();

        const upload_scenario: any = await okareo.upload_scenario_set({
            name: uniqueName("CI: Upload WebBizz Scenario"),
            file_path: "./tests/fixtures/generation-scenario.jsonl",
            project_id,
        });

        model = await okareo.register_model({
            name: uniqueName("CI: Generation"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            models: {
                type: "openai",
                model_id: "gpt-3.5-turbo",
                temperature: 0.5,
                system_prompt_template: SYSTEM_PROMPT,
                user_prompt_template: USER_PROMPT,
            } as OpenAIModel,
        });

        await model.run_test({
            model_api_key: OPENAI_API_KEY,
            name: uniqueName("CI: Custom Test Run"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            scenario: upload_scenario,
            calculate_metrics: true,
            type: TestRunType.NL_GENERATION,
            checks: ["consistency_summary", "relevance_summary"],
        } as RunTestProps);
    });

    test("Create or Return Model", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const existing_model = await okareo.register_model({
            name: uniqueName("CI: Generation"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            models: {
                type: "openai",
                model_id: "gpt-3.5-turbo",
                temperature: 0.5,
                system_prompt_template: SYSTEM_PROMPT,
                user_prompt_template: USER_PROMPT,
            } as OpenAIModel,
        });
        expect(existing_model).toBeDefined();
        expect(existing_model.mut?.models?.openai?.api_keys).toBeUndefined();
    });

    test("Find Datapoints", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });

        const datapoints = await okareo.find_datapoints(
            DatapointSearch({
                project_id,
                mut_id: model.mut.id,
            }),
        );

        expect(datapoints.length).toBeGreaterThan(0);
    });
});
