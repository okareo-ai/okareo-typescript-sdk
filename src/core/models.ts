import createClient from 'openapi-fetch';
import type { paths, components } from "../api/v1/okareo_endpoints";


const CHECK_IN_RUN_TEST_WARNING = "The `checks` parameter was passed to `run_test` for an unsupported TestRunType. " +
"Currently, `checks` are only used when type=TestRunType.NL_GENERATION.";

export function ScenarioSetCreate(props: components["schemas"]["ScenarioSetCreate"]): components["schemas"]["ScenarioSetCreate"] {
    return props;
}

export function SeedData(props: components["schemas"]["SeedData"]): components["schemas"]["SeedData"] {
    return props;
}

export function ScenarioSetGenerate(props: components["schemas"]["ScenarioSetGenerate"]): components["schemas"]["ScenarioSetGenerate"] {
    return props;
}

export function DatapointSearch(props: components["schemas"]["DatapointSearch"]): components["schemas"]["DatapointSearch"] {
    return props;
}

export enum ScenarioType {
    COMMON_CONTRACTIONS = "COMMON_CONTRACTIONS",
    COMMON_MISSPELLINGS = "COMMON_MISSPELLINGS",
    CONDITIONAL = "CONDITIONAL",
    LABEL_REVERSE_INVARIANT = "LABEL_REVERSE_INVARIANT",
    NAMED_ENTITY_SUBSTITUTION = "NAMED_ENTITY_SUBSTITUTION",
    NEGATION = "NEGATION",
    REPHRASE_INVARIANT = "REPHRASE_INVARIANT",
    ROUNDTRIP_INVARIANT = "ROUNDTRIP_INVARIANT",
    SEED = "SEED",
    TERM_RELEVANCE_INVARIANT = "TERM_RELEVANCE_INVARIANT",
    TEXT_REVERSE_LABELED = "TEXT_REVERSE_LABELED",
    TEXT_REVERSE_QUESTION = "TEXT_REVERSE_QUESTION",
}

export enum TestRunType {
    INFORMATION_RETRIEVAL = "INFORMATION_RETRIEVAL",
    INVARIANT = "invariant",
    MULTI_CLASS_CLASSIFICATION = "MULTI_CLASS_CLASSIFICATION",
    NL_GENERATION = "NL_GENERATION",
}


export interface BaseModel {
    type: string;
}
export interface OpenAIModel extends BaseModel {
    type: "openai";
    model_id: string;
    temperature: number;
    system_prompt_template: string;
    user_prompt_template: string;
}
export interface CohereModel extends BaseModel {
    type: "cohere";
    model_id: string;
    model_type: string;
    input_type?: string;
}
export interface PineconeDB extends BaseModel {
    type: "pinecone";
    index_name: string;
    region: string;
    project_id: string;
    top_k: number;
}
export interface QDrant extends BaseModel {
    type: "qdrant";
    collection_name: string;
    url: string;
    top_k: number;
    sparse?: boolean;
}
export interface CustomModel extends BaseModel {
    type: "custom";
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    invoke?: (input: any, result: any) => unknown; // allows a Promise or direct return in the response
}

export interface ModelUnderTestProps {
    api_key: string; // Okareo API Key
    endpoint: string; // Okareo API Endpoint
    mut: components["schemas"]["ModelUnderTestResponse"];
}

export interface RunTestProps {
    model_api_key?: string| {[key: string]: string} | undefined;
    project_id: string;
    scenario_id?: string;
    scenario?: components["schemas"]["ScenarioSetResponse"];
    name: string;
    type: TestRunType;
    calculate_metrics: boolean;
    metrics_kwargs?: {[key: string]: any};
    tags?: string[];
    checks?: string[];
}

export class ModelUnderTest {
    api_key: string = '';
    endpoint: string = '';
    mut: components["schemas"]["ModelUnderTestResponse"] | undefined;

    constructor(props: ModelUnderTestProps) {
        if (!props.api_key || props.api_key.length === 0) { throw new Error("API Key is required"); }
        const { api_key, endpoint } = props;
        this.api_key = api_key;
        this.endpoint = endpoint;
        this.mut = props.mut;
    }

    async run_test(props: RunTestProps): Promise<components["schemas"]["TestRunItem"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        if (!this.mut) { throw new Error("A registered model is required"); }
        if (props.type !== TestRunType.NL_GENERATION && props.checks && props.checks.length > 0) {
            console.warn(CHECK_IN_RUN_TEST_WARNING);
        }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        
        const modelKeys = Object.getOwnPropertyNames(this.mut?.models)
        const mType = modelKeys[0];
        if (!props.scenario_id && props.scenario) {
            props.scenario_id = props.scenario.scenario_id;
        }
        if (mType === "custom") {
            const { scenario_id = "NONE" } = props;
            delete props.scenario;
            /*
            const seed_data = await this.okareo.get_scenario_data_points(scenario_id);
            */
            const scenario_results = await client.GET("/v0/scenario_data_points/{scenario_id}", {
                params: {
                    header: {
                        "api-key": this.api_key
                    },
                    path: { scenario_id: scenario_id }
                }
            });
            if (scenario_results.error) {
                throw scenario_results.error;
            }
            const seed_data = scenario_results.data;
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
            const results: any = { model_data: {} };
            for (let i = 0; i < seed_data.length; i++) {
                const { id, input, result } = seed_data[i];
                const invoke = (this.mut.models?.custom as unknown as CustomModel).invoke;
                if (invoke) {
                    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
                    const customResult: any = await invoke(input, result);
                    results.model_data[id] = {
                        "actual": customResult[0],
                        "model_response": customResult[1],
                    };
                }
            }
            const body:components["schemas"]["TestRunPayloadV2"] = {
                ...props,
                mut_id: this.mut.id,
                model_results: results,
                checks: props.checks,
            } as components["schemas"]["TestRunPayloadV2"];
            const { data, error } = await client.POST("/v0/test_run", {
                params: {
                    header: {
                        "api-key": this.api_key
                    },
                },
                body: body,
            });
            if (error) {
                throw error;
            }
            return data || {};
        } else {
            const mKey = props.model_api_key ?? "NONE";

            const body:components["schemas"]["TestRunPayloadV2"] = {
                ...props,
                mut_id: this.mut.id,
                api_keys: await this.validateRunTestParams(mKey, props.type),
                checks: props.checks,
            } as components["schemas"]["TestRunPayloadV2"];
            const { data, error } = await client.POST("/v0/test_run", {
                params: {
                    header: {
                        "api-key": this.api_key
                    },
                },
                body: body,
            });
            if (error) {
                throw error;
            }
            return data || {};
        }
    }


    private async validateRunTestParams(
        model_api_key: string| {[key: string]: string},
        testRunType: TestRunType
    ): Promise<{[key: string]: string}> {
        const modelNames = this.mut?.models ? Object.keys(this.mut?.models) : [];

        let runApiKeys: {[key: string]: string};
        runApiKeys = typeof model_api_key === 'object' ? model_api_key :
             typeof model_api_key === 'string' ? {[modelNames[0]]: model_api_key} :
             {};


        if (!modelNames.includes("custom") && modelNames.length !== Object.keys(runApiKeys).length) {
            throw new Error("Number of models and API keys does not match");
        }

        if (testRunType === TestRunType.INFORMATION_RETRIEVAL && 
            ["pinecone", "qdrant", "custom"].every(db => !modelNames.includes(db))) {
            throw new Error("No vector database specified");
        }

        return runApiKeys;
    }

}
