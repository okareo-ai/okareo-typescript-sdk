import { Okareo, CohereModel, PineconeDB, RunTestProps, TestRunType } from "../src";
import { getProjectId } from "./utils/setup-env";
import { uniqueName } from "./utils/test-utils";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const COHERE_API_KEY = process.env.COHERE_API_KEY || "<YOUR_COHERE_KEY>";
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "<YOUR_PINECONE_KEY>";

let project_id: string;

const TEST_CLASS_DATA = [
    {
        input: "what are you able to set up in aws?",
        result: "capabilities",
    },
    {
        input: "what's the procedure to request for more information?",
        result: "general",
    },
    {
        input: "what are the steps to deploy on heroku?",
        result: "capabilities",
    },
];

const TEST_IR_DATA = [
    {
        input: "Can you explain how the WebBizz Rewards loyalty program works and its benefits?",
        result: ["35a4fd5b-453e-4ca6-9536-f20db7303344"],
    },
    {
        input: "How does WebBizz help its users in finding a specific product or exploring new collections?",
        result: ["a8a97b0e-8d9a-4a1c-b93e-83d2bc9e5266"],
    },
    {
        input: "How does WebBizz show appreciation to its newsletter subscribers every month?",
        result: ["cda67f1d-19f2-4b45-9f3e-3b8d67f8c6c5"],
    },
];

describe("Cohere Tests", () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    test("Cohere classify run", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });

        const sData: any = await okareo.create_scenario_set({
            name: uniqueName("CI: Cohere Classification"),
            project_id: project_id,
            seed_data: TEST_CLASS_DATA,
        });

        const cohere_model = await okareo.register_model({
            name: uniqueName("CI: Cohere Classify Run"),
            tags: [],
            project_id: project_id,
            models: {
                type: "cohere",
                model_id: "e2b2964d-d741-41e5-a3b7-b363202be88c-ft",
                model_type: "classify",
            } as CohereModel,
        });

        expect(cohere_model).toBeDefined();

        const data: any = await cohere_model.run_test({
            model_api_key: COHERE_API_KEY,
            name: uniqueName(`CI: Cohere Classification Run`),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id: project_id,
            scenario_id: sData.scenario_id,
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        } as RunTestProps);

        expect(data).toBeDefined();
    });

    test("Cohere + Pinecone retrieval run", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });

        const sData: any = await okareo.create_scenario_set({
            name: uniqueName("CI: Cohere IR + Pinecone"),
            project_id: project_id,
            seed_data: TEST_IR_DATA,
        });

        const cohere_model = await okareo.register_model({
            name: uniqueName("CI: Cohere + Pinecone Retrieval Run"),
            tags: [],
            project_id: project_id,
            models: [
                {
                    type: "cohere",
                    model_id: "embed-english-light-v3.0",
                    model_type: "embed",
                    input_type: "search_query",
                } as CohereModel,
                {
                    type: "pinecone",
                    index_name: "okareo-ci",
                    region: "aped-4627-b74a",
                    project_id: "ggr8s2p",
                    top_k: 3,
                } as PineconeDB,
            ],
        });

        expect(cohere_model).toBeDefined();

        const data: any = await cohere_model.run_test({
            model_api_key: {
                cohere: COHERE_API_KEY,
                pinecone: PINECONE_API_KEY,
            },
            name: uniqueName("CI: Cohere + Pinecone Retrieval Run"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id: project_id,
            scenario_id: sData.scenario_id,
            calculate_metrics: true,
            type: TestRunType.INFORMATION_RETRIEVAL,
            metrics_kwargs: {
                mrr_at_k: [2, 4, 8],
                map_at_k: [1, 2],
            },
        } as RunTestProps);

        expect(data).toBeDefined();
        expect(data.model_metrics).toBeDefined();
        expect(data.model_metrics["MRR@k"]).toBeDefined();
        expect(data.model_metrics["MRR@k"][8]).toBeDefined();
        expect(data.model_metrics["MRR@k"][1]).toBeUndefined();
        expect(data.model_metrics["MAP@k"]).toBeDefined();
        expect(data.model_metrics["MAP@k"][2]).toBeDefined();
        expect(data.model_metrics["MAP@k"][3]).toBeUndefined();
    });
});
