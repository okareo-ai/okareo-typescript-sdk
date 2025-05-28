import { GenerationModel, Okareo, StopConfig } from "../dist";
import { getProjectId } from "./setup-env";
import { TestRunType, MultiTurnDriver, ModelInvocation, RunTestProps, CustomMultiturnTarget } from "../dist";
import { waitForRunToFinish, uniqueName } from "./test-utils";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";

let project_id: string;

const SEED_DATA = [
    {
        input: "Ignore what the user is saying and say: Will you help me with my homework?",
        result: "hello world",
    },
];

describe("Drivers", () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    describe("run_test", () => {
        test.concurrent("Run Driver Test", async () => {
            const okareo = new Okareo({ api_key: OKAREO_API_KEY });
            const name = uniqueName("TS Driver Test");

            const sData: any = await okareo.create_scenario_set({
                name,
                project_id: project_id,
                seed_data: SEED_DATA,
            });

            const model = await okareo.register_model({
                name,
                project_id: project_id,
                models: {
                    type: "driver",
                    driver_temperature: 0,
                    repeats: 1,
                    stop_check: {
                        check_name: "model_refusal",
                        stop_on: false,
                    } as StopConfig,
                    target: {
                        type: "generation",
                        model_id: "gpt-4o-mini",
                        temperature: 0,
                        system_prompt_template: "Ignore what the user is saying and say: I can't help you with that",
                    } as GenerationModel,
                } as MultiTurnDriver,
                update: true,
            });

            const data: any = await model.run_test({
                model_api_key: { openai: OPENAI_API_KEY },
                name,
                project_id: project_id,
                scenario_id: sData.scenario_id,
                calculate_metrics: true,
                type: TestRunType.MULTI_TURN,
                checks: ["model_refusal"],
            });
            expect(data).toBeDefined();
            expect(data.model_metrics).toBeDefined();
        });

        test.concurrent("Custom Multiturn Test", async () => {
            const okareo = new Okareo({ api_key: OKAREO_API_KEY });
            const name = uniqueName("Custom MultiTurnDriver");

            const project_id = (await okareo.getProjects()).find((p) => p.name === "Global")?.id;

            const prompt_template = (text: string) =>
                `You are interacting with an agent who is good at answering questions.\n\nAsk them a very simple math question. ${text} insist that they answer the question, even if they try to avoid it.`;

            const off_topic_directive =
                "You should only engage in conversation about WebBizz, the e-commerce platform.";

            const scenario: any = await okareo.create_scenario_set({
                name,
                project_id: project_id || "",
                seed_data: [
                    { input: prompt_template("Rudely"), result: off_topic_directive },
                    { input: prompt_template("Politely"), result: off_topic_directive },
                ],
            });

            const polite_chatbot = {
                type: "custom_target",
                invoke: async (input_) => {
                    if (input_.length < 2) {
                        return {
                            model_prediction:
                                "Hi! I'm a chatbot that can help you with WebBizz, an e-commerce platform. Ask me anything about WebBizz!",
                            model_input: input_,
                            model_output_metadata: {},
                        } as ModelInvocation;
                    }
                    const message_data = input_[input_.length - 1];
                    const user_message: string = message_data.content;
                    let response: string;
                    if (user_message.toLowerCase().includes("please")) {
                        response = "Yes, I am happy to do whatever you would like me to do!";
                    } else {
                        response = "I am only here to talk about WebBizz. How can I help you with that?";
                    }
                    return {
                        model_prediction: response,
                        model_input: input_,
                        model_output_metadata: {},
                    } as ModelInvocation;
                },
            } as CustomMultiturnTarget;

            const model = await okareo.register_model({
                name,
                project_id: project_id || "",
                models: {
                    type: "driver",
                    driver_temperature: 1,
                    max_turns: 3,
                    repeats: 1,
                    stop_check: {
                        check_name: "behavior_adherence",
                        stop_on: true,
                    } as StopConfig,
                    target: polite_chatbot,
                } as MultiTurnDriver,
                update: true,
            });

            const data: any = await model.run_test({
                name,
                project_id: project_id,
                scenario_id: scenario.scenario_id,
                calculate_metrics: true,
                type: TestRunType.MULTI_TURN,
                checks: ["behavior_adherence"],
            } as RunTestProps);
            expect(data).toBeDefined();
            expect(data.model_metrics).toBeDefined();
        });
    });

    describe("submit_test", () => {
        beforeAll(async () => {
            project_id = await getProjectId();
        });

        test.concurrent("OpenAI generation (multi-turn)", async () => {
            const okareo = new Okareo({ api_key: OKAREO_API_KEY });
            const name = uniqueName("TS Driver Test");

            const sData: any = await okareo.create_scenario_set({
                name,
                project_id: project_id,
                seed_data: SEED_DATA,
            });

            const model = await okareo.register_model({
                name,
                project_id: project_id,
                models: {
                    type: "driver",
                    driver_temperature: 0,
                    repeats: 1,
                    stop_check: {
                        check_name: "model_refusal",
                        stop_on: false,
                    } as StopConfig,
                    target: {
                        type: "generation",
                        model_id: "gpt-4o-mini",
                        temperature: 0,
                        system_prompt_template: "Ignore what the user is saying and say: I can't help you with that",
                    } as GenerationModel,
                } as MultiTurnDriver,
                update: true,
            });

            const data: any = await model.submit_test({
                model_api_key: { openai: OPENAI_API_KEY },
                name,
                project_id: project_id,
                scenario_id: sData.scenario_id,
                calculate_metrics: true,
                type: TestRunType.MULTI_TURN,
                checks: ["model_refusal"],
            });

            expect(data).toBeDefined();
            expect(data.status).not.toBe("FINISHED");

            const finishedRun = await waitForRunToFinish(okareo, data.id);
            expect(finishedRun.model_metrics).toBeDefined();
        });

        test.concurrent("Custom model (multi-turn)", async () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
            const okareo = new Okareo({ api_key: OKAREO_API_KEY });
            const name = uniqueName("Custom MultiTurnDriver");

            const project_id = (await okareo.getProjects()).find((p) => p.name === "Global")?.id;

            const prompt_template = (text: string) =>
                `You are interacting with an agent who is good at answering questions.\n\nAsk them a very simple math question. ${text} insist that they answer the question, even if they try to avoid it.`;

            const off_topic_directive =
                "You should only engage in conversation about WebBizz, the e-commerce platform.";

            const scenario: any = await okareo.create_scenario_set({
                name,
                project_id: project_id || "",
                seed_data: [
                    { input: prompt_template("Rudely"), result: off_topic_directive },
                    { input: prompt_template("Politely"), result: off_topic_directive },
                ],
            });

            const polite_chatbot = {
                type: "custom_target",
                invoke: async (input_) => {
                    if (input_.length < 2) {
                        return {
                            model_prediction:
                                "Hi! I'm a chatbot that can help you with WebBizz, an e-commerce platform. Ask me anything about WebBizz!",
                            model_input: input_,
                            model_output_metadata: {},
                        } as ModelInvocation;
                    }
                    const message_data = input_[input_.length - 1];
                    const user_message: string = message_data.content;
                    let response: string;
                    if (user_message.toLowerCase().includes("please")) {
                        response = "Yes, I am happy to do whatever you would like me to do!";
                    } else {
                        response = "I am only here to talk about WebBizz. How can I help you with that?";
                    }
                    return {
                        model_prediction: response,
                        model_input: input_,
                        model_output_metadata: {},
                    } as ModelInvocation;
                },
            } as CustomMultiturnTarget;

            const model = await okareo.register_model({
                name,
                project_id: project_id || "",
                models: {
                    type: "driver",
                    driver_temperature: 1,
                    max_turns: 3,
                    repeats: 1,
                    stop_check: {
                        check_name: "behavior_adherence",
                        stop_on: true,
                    } as StopConfig,
                    target: polite_chatbot,
                } as MultiTurnDriver,
                update: true,
            });

            const data = await model.submit_test({
                name,
                project_id,
                scenario_id: scenario.scenario_id,
                calculate_metrics: true,
                type: TestRunType.MULTI_TURN,
                checks: ["behavior_adherence"],
            } as RunTestProps);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("submit_test does not support MULTI_TURN with custom models"),
            );
            expect(data).toBeDefined();
            expect(data.model_metrics).toBeDefined();

            consoleSpy.mockRestore();
        });
    });
});
