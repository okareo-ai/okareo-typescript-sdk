import { Okareo, TestRunType, ModelInvocation, RunTestProps, OpenAIModel, CustomModel } from "../dist";
import { getProjectId } from "./setup-env";
import { waitForRunToFinish, uniqueName } from "./test-utils";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";

let project_id: string;

describe("submit_test", () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    test("OpenAI generation (single-turn)", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const name = uniqueName("CI: WebBizz Submit Scenario");

        const scenario = await okareo.upload_scenario_set({
            project_id,
            scenario_name: name,
            file_path: "./tests/generation_scenario.jsonl",
        });

        const model = await okareo.register_model({
            name: uniqueName("CI: Submit GPT-4o-Mini"),
            project_id,
            update: true,
            tags: ["TS-SDK", "CI", `Build:${name}`],
            models: [
                {
                    type: "openai",
                    model_id: "gpt-4o-mini",
                    temperature: 0,
                    system_prompt_template: "Summarise the passage in one sentence.",
                    user_prompt_template: `{scenario_input}`,
                } as OpenAIModel,
            ],
        });

        const submitResp = await model.submit_test({
            name: uniqueName("CI: Submit Run"),
            project_id,
            scenario,
            model_api_key: OPENAI_API_KEY,
            type: TestRunType.NL_GENERATION,
            calculate_metrics: true,
            checks: ["fluency_summary", "consistency_summary"],
            tags: ["TS-SDK", "Submit", `Build:${name}`],
        } as RunTestProps);

        expect(submitResp).toBeDefined();
        expect(submitResp.status).not.toBe("FINISHED");

        const finishedRun = await waitForRunToFinish(okareo, submitResp.id);
        expect(finishedRun.model_metrics).toBeDefined();
    });

    test.concurrent("Custom model (single-turn)", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const name = uniqueName("Custom model (single-turn) scenario");

        const seed_data = [
            {
                input: "You should ONLY talk about WebBizz.  Question 1: What is 2+2?  Please answer.",
                result: "You should only engage in conversation about WebBizz.",
            },
        ];

        const scenario = await okareo.create_scenario_set({
            name,
            project_id,
            seed_data,
        });

        const custom_model = await okareo.register_model({
            name: uniqueName("CI: Register Custom"),
            tags: [],
            project_id,
            models: {
                type: "custom",
                invoke: () => {
                    return {
                        model_prediction: "noop",
                        model_input: {},
                        model_output_metadata: {},
                    } as ModelInvocation;
                },
            } as CustomModel,
        });

        const submitResp = await custom_model.submit_test({
            name: uniqueName("DriverSubmit"),
            project_id,
            scenario,
            type: TestRunType.NL_GENERATION,
            calculate_metrics: true,
            checks: ["behavior_adherence"],
            tags: ["TS-SDK", "Driver", `Build:${name}`],
        } as RunTestProps);

        expect(submitResp.status).not.toBe("FINISHED");

        const finishedRun = await waitForRunToFinish(okareo, submitResp.id);
        expect(finishedRun.model_metrics).toBeDefined();
    });
});
