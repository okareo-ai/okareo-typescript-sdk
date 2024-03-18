import createClient from "openapi-fetch";
import type { paths, components } from "./api/v1/okareo_endpoints";

import * as fs from "fs";

export interface OkareoProps {
    api_key: string;
    endpoint?: string;
   // project_id?: string | undefined;
}

export interface UploadScenarioSetProps {
    project_id: string;
    scenario_name: string;
    file_path: string;
}

export interface RunTestProps {
    project_id: string;
    scenario_id: string;
    model_api_key: string| undefined;
    name: string;
    type: string;
    calculate_metrics: boolean;
    metrics_kwargs?: any;
    tags?: string[];
}

export class Okareo {
    api_key: string = '';
    endpoint: string = '';
    model_request: components["schemas"]["ModelUnderTestSchema"] | undefined;
    model: components["schemas"]["ModelUnderTestResponse"] | undefined;
    //project_id: string | undefined;

    constructor(props: OkareoProps) {
        if (!props.api_key || props.api_key.length === 0) { throw new Error("API Key is required"); }
        const { api_key, endpoint = "https://api.okareo.com/" /*, project_id */ } = props;
        this.api_key = api_key;
        this.endpoint = endpoint;
        //this.project_id = project_id;
    }

    async getProjects(): Promise<components["schemas"]["ProjectResponse"][]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/projects", {
            params: {
                header: {
                    "api-key": this.api_key
                }
            }
        });
        if (error) {
            throw error;
        }
        return data || [];
    }

    async create_scenario_set(props: components["schemas"]["ScenarioSetCreate"]): Promise<components["schemas"]["ScenarioSetResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.POST("/v0/scenario_sets", {
            params: {
                header: {
                    "api-key": this.api_key
                },
            },
            body: props
            
        });
        if (error) {
            throw error;
        }
        return data || {};
    }

    async generate_scenario_set(props: components["schemas"]["ScenarioSetGenerate"]): Promise<components["schemas"]["ScenarioSetResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.POST("/v0/scenario_sets_generate", {
            params: {
                header: {
                    "api-key": this.api_key
                },
            },
            body: props
            
        });
        if (error) {
            throw error;
        }
        return data || {};
    }

    async get_scenario_data_points(scenario_id: string): Promise<components["schemas"]["ScenarioDataPoinResponse"][]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        if (!scenario_id || scenario_id.length === 0) { throw new Error("API Key is required"); }
        
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/scenario_data_points/{scenario_id}", {
            params: {
                header: {
                    "api-key": this.api_key
                },
                path: { scenario_id: scenario_id }
            }
        });
        if (error) {
            throw error;
        }
        return data || [];
    }

    async find_datapoints(props: components["schemas"]["DatapointSearch"]): Promise<components["schemas"]["DatapointListItem"][]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.POST("/v0/find_datapoints", {
            params: {
                header: {
                    "api-key": this.api_key
                },
            },
            body: props
            
        });
        if (error) {
            throw error;
        }
        return data || {};
    }

    async upload_scenario_set(props: UploadScenarioSetProps): Promise<components["schemas"]["ScenarioSetResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        // shimming difference between REST API and SDK
        try {
            const file = fs.readFileSync(props.file_path);
            console.log(file);
            const { data, error } = await client.POST("/v0/scenario_sets_upload", {
                params: {
                    header: {
                        "api-key": this.api_key
                    },
                },
                body: {
                    name: props.scenario_name,
                    file: props.file_path,
                    project_id: props.project_id
                }
                
            });
            if (error) {
                throw error;
            }
            return data || {};
        } catch (e) {
            throw new Error("File not found");
        }
    }
    
    async register_model(props: components["schemas"]["ModelUnderTestSchema"]): Promise<components["schemas"]["ModelUnderTestResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { models } = props;
        const { data, error } = await client.POST("/v0/register_model", {
            params: {
                header: {
                    "api-key": this.api_key
                },
            },
            body: props
            
        });
        if (error) {
            throw error;
        }
        if (data.id) {
            this.model_request = props;
            this.model = data as components["schemas"]["ModelUnderTestResponse"];
        }
        return data || {};
    }

    async run_test(props: RunTestProps): Promise<components["schemas"]["TestRunItem"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        if (!this.model) { throw new Error("A registered model is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const modelKeys = Object.getOwnPropertyNames(this.model_request?.models)
        const mType = modelKeys[0];
        const mKey = (this.model_request?.models)?this.model_request?.models[mType].api_keys[mType]:"NONE";
        const body:components["schemas"]["TestRunPayloadV2"] = {
            ...props,
            mut_id: this.model.id,
            api_keys: {
                [mType]: mKey
            }
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

    async get_test_run(test_run_id: string): Promise<components["schemas"]["TestRunItem"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/test_runs/{test_run_id}", {
            params: {
                header: {
                    "api-key": this.api_key
                },
                path: { test_run_id: test_run_id }
            }
        });
        if (error) {
            throw error;
        }
        return data || {};
    }

}
