import { Okareo, OpenAIModel, RunTestProps, TestRunType } from "../src";
import { getProjectId } from "./utils/setup-env";
import { uniqueName } from "./utils/test-utils";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";

let project_id: string;

const JSON_DAILOG_INLINE = [
    {
        input: [
            { role: "system", content: "You are super genious mind reader!" },
            {
                role: "user",
                content:
                    "I want to know the temperature in location i'm thinking of ... " +
                    "figure out the location and temperature!",
            },
            { role: "assistant", content: "I can help you with that!" },
            {
                role: "function",
                name: "get_temp",
                content: "Error from server (NotFound)",
            },
        ],
        result: { role: "assistant", content: "Oops!" },
    },
];

describe("Test Dialog", () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    test("Test Dialog Input", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });

        const scenario: any = await okareo.create_scenario_set({
            name: uniqueName("CI: Test Dialog Input"),
            project_id,
            seed_data: JSON_DAILOG_INLINE,
        });

        const model = await okareo.register_model({
            name: uniqueName("CI: Test Dialog Input"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            models: [
                {
                    type: "openai",
                    model_id: "gpt-3.5-turbo",
                    temperature: 0.5,
                    dialog_template: "{scenario_input}",
                } as OpenAIModel,
            ],
            update: true,
        });

        const data = await model.run_test({
            model_api_key: OPENAI_API_KEY,
            name: uniqueName("CI: Test Dialog Input"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id,
            scenario,
            calculate_metrics: true,
            type: TestRunType.NL_GENERATION,
            checks: ["compression_ratio"],
        } as RunTestProps);

        expect(data).toBeDefined();
    });
});
