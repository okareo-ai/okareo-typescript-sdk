import createClient from "openapi-fetch";
import type { paths, components } from "../api/v1/okareo_endpoints";
import * as nats from "nats";

const CHECK_IN_RUN_TEST_WARNING =
    "The `checks` parameter was passed to `run_test` for an unsupported TestRunType. " +
    "Currently, `checks` are only used when type=TestRunType.NL_GENERATION.";

export function ScenarioSetCreate(
    props: components["schemas"]["ScenarioSetCreate"],
): components["schemas"]["ScenarioSetCreate"] {
    return props;
}

export function SeedData(props: components["schemas"]["SeedData"]): components["schemas"]["SeedData"] {
    return props;
}

export function ScenarioSetGenerate(
    props: components["schemas"]["ScenarioSetGenerate"],
): components["schemas"]["ScenarioSetGenerate"] {
    return props;
}

export function DatapointSearch(
    props: components["schemas"]["DatapointSearch"],
): components["schemas"]["DatapointSearch"] {
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
    CUSTOM_GENERATOR = "CUSTOM_GENERATOR",
}

export enum TestRunType {
    INFORMATION_RETRIEVAL = "INFORMATION_RETRIEVAL",
    INVARIANT = "invariant",
    MULTI_CLASS_CLASSIFICATION = "MULTI_CLASS_CLASSIFICATION",
    NL_GENERATION = "NL_GENERATION",
    MULTI_TURN = "MULTI_TURN",
}

export interface BaseModel {
    type: string;
}
/**
 * Interface representing a model invocation returned from a CustomModel.invoke function
 */
export interface ModelInvocation {
    /**
     * Prediction from the model to be used when running the evaluation,
     * e.g. predicted class from classification model or generated text completion from
     * a generative model. This would typically be parsed out of the overall model_output_metadata
     */
    model_prediction?: Record<string, any> | unknown[] | string;
    /**
     * All the input sent to the model
     */
    model_input?: Record<string, any> | unknown[] | string;
    /**
     * Full model response, including any metadata returned with model's output
     */
    model_output_metadata?: Record<string, any> | unknown[] | string;
    /**
     * List of tool calls made during the model invocation, if any
     */
    tool_calls?: any[];
}

export interface OpenAIModel extends BaseModel {
    type: "openai";
    model_id?: string;
    temperature?: number;
    system_prompt_template: string;
    user_prompt_template?: string;
    dialog_template?: string;
    tools?: unknown[];
}
export interface GenerationModel extends BaseModel {
    type: "generation";
    model_id?: string;
    temperature?: number;
    system_prompt_template: string;
    user_prompt_template?: string;
    dialog_template?: string;
    tools?: unknown[];
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
    invoke?: (input: Record<string, any> | unknown[] | string) => ModelInvocation; // allows a Promise or direct return in the response
}
export interface CustomMultiturnTarget extends BaseModel {
    type: "custom_target";
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    invoke?: (messages: { [key: string]: any }[]) => ModelInvocation;
}
export interface StopConfig {
    check_name: string;
    stop_on?: boolean;
}
export interface MultiTurnDriver extends BaseModel {
    type: "driver";
    target: OpenAIModel | CustomMultiturnTarget | GenerationModel;
    stop_check: StopConfig;
    driver_temperature?: number;
    repeats?: number;
    max_turns?: number;
    first_turn?: string;
}

export interface ModelUnderTestProps {
    api_key: string; // Okareo API Key
    endpoint: string; // Okareo API Endpoint
    mut: components["schemas"]["ModelUnderTestResponse"];
}

export interface RunTestProps {
    model_api_key?: string | { [key: string]: string } | undefined;
    project_id: string;
    scenario_id?: string;
    scenario?: components["schemas"]["ScenarioSetResponse"];
    name: string;
    type: TestRunType;
    calculate_metrics: boolean;
    metrics_kwargs?: { [key: string]: any };
    tags?: string[];
    checks?: string[];
}

export class ModelUnderTest {
    api_key: string = "";
    endpoint: string = "";
    mut: components["schemas"]["ModelUnderTestResponse"] | undefined;

    constructor(props: ModelUnderTestProps) {
        if (!props.api_key || props.api_key.length === 0) {
            throw new Error("API Key is required");
        }
        const { api_key, endpoint } = props;
        this.api_key = api_key;
        this.endpoint = endpoint;
        this.mut = props.mut;
    }

    async run_test(props: RunTestProps): Promise<components["schemas"]["TestRunItem"]> {
        let result: any;
        if (!this.api_key || this.api_key.length === 0) {
            throw new Error("API Key is required");
        }
        if (!this.mut) {
            throw new Error("A registered model is required");
        }
        if (
            props.type !== TestRunType.NL_GENERATION &&
            props.type !== TestRunType.MULTI_TURN &&
            props.checks &&
            props.checks.length > 0
        ) {
            console.warn(CHECK_IN_RUN_TEST_WARNING);
        }
        const client = createClient<paths>({ baseUrl: this.endpoint });

        let natsConnection: nats.NatsConnection | null = null;
        const results: any = { model_data: {} };

        try {
            const modelKeys = Object.getOwnPropertyNames(this.mut?.models);
            const mType = modelKeys[0];
            if (!props.scenario_id && props.scenario) {
                props.scenario_id = props.scenario.scenario_id;
            }

            if (this.isCustom(mType) && mType === "driver") {
                const { data: creds, error: credsError } = await client.GET("/v0/internal_custom_model_listener", {
                    params: {
                        header: {
                            "api-key": this.api_key,
                        },
                        query: {
                            mut_id: this.mut.id,
                        },
                    },
                });
                if (credsError) {
                    throw credsError;
                }
                if (creds && typeof creds === "object" && "jwt" in creds && "seed" in creds && "local_nats" in creds) {
                    const natsJwt = creds.jwt as string;
                    const seed = creds.seed as string;
                    const localNats = creds.local_nats as string;

                    natsConnection = await this.connectNats(natsJwt, seed, localNats);

                    this.startCustomModelListener(natsConnection);
                }
            } else if (this.isCustom(mType)) {
                const { scenario_id = "NONE" } = props;
                delete props.scenario;
                /*
                const seed_data = await this.okareo.get_scenario_data_points(scenario_id);
                */
                const scenario_results = await client.GET("/v0/scenario_data_points/{scenario_id}", {
                    params: {
                        header: {
                            "api-key": this.api_key,
                        },
                        path: { scenario_id: scenario_id },
                    },
                });
                if (scenario_results.error) {
                    throw scenario_results.error;
                }
                const seed_data = scenario_results.data;
                // eslint-disable-next-line  @typescript-eslint/no-explicit-any
                for (let i = 0; i < seed_data.length; i++) {
                    const { id, input, result } = seed_data[i];
                    const invoke = (this.mut.models?.custom as unknown as CustomModel).invoke;
                    if (invoke) {
                        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
                        const modelInvocation: ModelInvocation = await invoke(input);
                        results.model_data[id] = {
                            actual: modelInvocation.model_prediction,
                            model_input: modelInvocation.model_input,
                            model_response: modelInvocation.model_output_metadata,
                        };
                    }
                }
            }

            const mKey = props.model_api_key ?? "NONE";

            const body: components["schemas"]["TestRunPayloadV2"] = {
                ...props,
                mut_id: this.mut.id,
                api_keys: this.isCustom(mType) ? undefined : await this.validateRunTestParams(mKey, props.type),
                model_results: results,
                checks: props.checks,
            } as unknown as components["schemas"]["TestRunPayloadV2"];
            const { data, error } = await client.POST("/v0/test_run", {
                params: {
                    header: {
                        "api-key": this.api_key,
                    },
                },
                body: body,
            });
            if (error) {
                throw error;
            }
            result = data;
        } finally {
            if (natsConnection) {
                await natsConnection.close();
            }
        }
        return result || {};
    }

    private isCustom(mType: any): boolean {
        return (
            mType === "custom" || (mType === "driver" && this.mut?.models?.driver.target["type"] === "custom_target")
        );
    }

    private async connectNats(userJwt: string, seed: string, localNats: string): Promise<nats.NatsConnection> {
        let nc: nats.NatsConnection;
        if (localNats !== "") {
            // Parse the URL to extract credentials if present
            let serverUrl = localNats;
            let username = undefined;
            let password = undefined;

            try {
                const parsedUrl = new URL(localNats);
                if (parsedUrl.username && parsedUrl.password) {
                    username = parsedUrl.username;
                    password = parsedUrl.password;
                    // Recreate URL without credentials
                    parsedUrl.username = "";
                    parsedUrl.password = "";
                    serverUrl = parsedUrl.toString();
                }
            } catch (e) {
                console.error("Failed to parse NATS URL:", e);
            }

            const natsOptions: nats.ConnectionOptions = {
                servers: [serverUrl],
                timeout: 120000,
                reconnect: true,
                maxReconnectAttempts: 10,
                reconnectTimeWait: 10000,
            };

            // Only add credentials if they were found in the URL
            if (username && password) {
                natsOptions.user = username;
                natsOptions.pass = password;
            }

            nc = await nats.connect(natsOptions);
        } else {
            // Connect to NGS with JWT authentication
            const natsOptions: nats.ConnectionOptions = {
                servers: ["wss://connect.ngs.global"],
                authenticator: nats.jwtAuthenticator(userJwt, Uint8Array.from(Buffer.from(seed))),
                timeout: 30000, // 30 seconds
                reconnect: true,
                maxReconnectAttempts: 5,
                reconnectTimeWait: 1000, // 1 second
            };

            nc = await nats.connect(natsOptions);
        }

        return nc;
    }

    private async startCustomModelListener(natsConnection: nats.NatsConnection): Promise<void> {
        const subscription = natsConnection.subscribe(`invoke.${this.mut?.id}`);
        for await (const msg of subscription) {
            try {
                // Use a more robust parsing method
                const data = this.safeParseJSON(msg.data);
                if (data.close) {
                    await msg.respond(nats.StringCodec().encode(JSON.stringify({ status: "disconnected" })));
                    await natsConnection.close();
                    return;
                }
                const args = data.args || [];
                const result = await this.callCustomInvoker(args);
                const jsonEncodableResult = this.getParamsFromCustomResult(result, args);
                await msg.respond(nats.StringCodec().encode(JSON.stringify(jsonEncodableResult)));
            } catch (e) {
                const errorMsg = `An error occurred in the custom model invocation: ${e}`;
                console.error(errorMsg);
                await msg.respond(nats.StringCodec().encode(JSON.stringify({ error: errorMsg })));
            }
        }
    }

    private safeParseJSON(data: Uint8Array): any {
        try {
            // First, try to parse it as a UTF-8 string
            const jsonString = new TextDecoder().decode(data);
            return JSON.parse(jsonString);
        } catch (e) {
            // If that fails, try to parse it as a Buffer
            const jsonString = Buffer.from(data).toString("utf-8");
            return JSON.parse(jsonString);
        }
    }

    private async callCustomInvoker(args: any[]): Promise<any> {
        const customModel = this.mut?.models?.custom as CustomModel | undefined;
        if (customModel && customModel.invoke) {
            return await customModel.invoke(args);
        }
        const customTarget = this.mut?.models?.driver.target as CustomModel | undefined;
        if (customTarget && customTarget.invoke) {
            return await customTarget.invoke(args);
        }
        throw new Error("Custom model invoke function not found");
    }

    private getParamsFromCustomResult(result: any, args: any): any {
        if (Array.isArray(result)) {
            return result;
        }
        if (typeof result === "object" && result !== null && "length" in result) {
            return Array.from(result);
        }
        return {
            actual: result.model_prediction || result["actual"],
            model_input: result.model_input || args,
            model_result: result.model_output_metadata || result.model_response || "",
            ...(result.session_id ? { session_id: result.session_id } : {}),
        };
    }

    private async validateRunTestParams(
        model_api_key: string | { [key: string]: string },
        testRunType: TestRunType,
    ): Promise<{ [key: string]: string }> {
        const modelNames = this.mut?.models ? Object.keys(this.mut?.models) : [];

        let runApiKeys: { [key: string]: string };
        runApiKeys =
            typeof model_api_key === "object"
                ? model_api_key
                : typeof model_api_key === "string"
                  ? { [modelNames[0]]: model_api_key }
                  : {};

        if (!modelNames.includes("custom") && modelNames.length !== Object.keys(runApiKeys).length) {
            throw new Error("Number of models and API keys does not match");
        }

        if (
            testRunType === TestRunType.INFORMATION_RETRIEVAL &&
            ["pinecone", "qdrant", "custom"].every((db) => !modelNames.includes(db))
        ) {
            throw new Error("No vector database specified");
        }

        return runApiKeys;
    }
}

export enum CheckOutputType {
    SCORE = "score",
    PASS_FAIL = "pass_fail",
}
