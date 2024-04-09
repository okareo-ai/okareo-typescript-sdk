import createClient from "openapi-fetch";
import fetch from 'node-fetch';
import type { paths, components } from "./api/v1/okareo_endpoints";
import FormData from "form-data";
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


export interface UploadEvaluatorProps {
    project_id: string;
    name: string;
    description: string;
    file_path?: string;
    evaluator_code?: string;
    requires_scenario_input?: boolean;
    requires_scenario_result?: boolean;
    output_data_type: "boolean" | "integer" | "float";
}

export interface RunTestProps {
    project_id: string;
    scenario_id?: string;
    scenario?: any;
    model_api_key?: string| undefined;
    name: string;
    type: string;
    calculate_metrics: boolean;
    metrics_kwargs?: any;
    tags?: string[];
    checks?: string[];
}

export class Okareo {
    api_key: string = '';
    endpoint: string = '';
    model_config: any; //components["schemas"]["ModelUnderTestSchema"] | undefined;
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
        if (data && data.warning) {
            console.log(data.warning);
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
        const eLength = this.endpoint.length;
        const api_endpoint = ((this.endpoint.substring(eLength-1) === "/")?this.endpoint.substring(0, eLength-1):this.endpoint)+"/v0/scenario_sets_upload";
        
        if (!fs.existsSync(props.file_path))
            throw new Error("File not found");
        const altFile = fs.readFileSync(props.file_path);

        console.log("Found File: "+altFile.toString().substring(0, 50)+"...");

        const file = fs.createReadStream(props.file_path);
        if (!file)
            throw new Error("File read error");

        const body: any = {
            project_id: props.project_id,
            name: props.scenario_name
        };
        const form = new FormData();
        form.append("name", props.scenario_name);
        form.append("project_id", props.project_id);
        form.append(
            'file', file
        );
        const headers = Object.assign({
            'api-key': `${this.api_key}`,
        }, form.getHeaders());

        const reqOptions = {
            method: 'POST',
            headers: headers,
            'body':form, // eslint-disable-line quote-props
        };
        
        return fetch(`${api_endpoint}`, reqOptions)
            .then(response => response.json())
            .then((data: any) => {
                if (data && data.warning) {
                    console.log(data.warning);
                }
                return data;
            })
            .catch((error) => {
                console.error(error);
                throw error;
            });
    }


    async register_model(props: any): Promise<components["schemas"]["ModelUnderTestResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const model_config: any = props; // this is used for the non-custom models
        const { type = "unknown", invoke} = model_config;
        if (type === "custom") {
            delete model_config.invoke;
        }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.POST("/v0/register_model", {
            params: {
                header: {
                    "api-key": this.api_key
                },
            },
            body: model_config
            
        });
        if (error) {
            throw error;
        }
        if (data.id) {
            this.model_config = props; // original registration (for all models)
            this.model = data as components["schemas"]["ModelUnderTestResponse"];
        }
        if (data && data.warning) {
            console.log(data.warning);
        }
        return data || {};
        
    }

    async run_test(props: RunTestProps): Promise<components["schemas"]["TestRunItem"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        if (!this.model) { throw new Error("A registered model is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const modelKeys = Object.getOwnPropertyNames(this.model_config?.models)
        const mType = modelKeys[0];
        if (mType === "custom") {
            if (!props.scenario_id && props.scenario) {
                props.scenario_id = props.scenario.scenario_id;
            }
            let { scenario_id = "NONE" } = props;
            delete props.scenario;
            const seed_data = await this.get_scenario_data_points(scenario_id);
            const results: any = {model_data: {} };
            for (let i = 0; i < seed_data.length; i++) {
                const { id, input } = seed_data[i];
                const customResult = this.model_config?.models?.custom.invoke(input);
                results.model_data[id] = customResult;
            }
            const body:components["schemas"]["TestRunPayloadV2"] = {
                ...props,
                mut_id: this.model.id,
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
            const mKey = (mType === "openai" && this.model_config?.models)?this.model_config?.models[mType]?.api_keys[mType]:"NONE";
            const body:components["schemas"]["TestRunPayloadV2"] = {
                ...props,
                mut_id: this.model.id,
                api_keys: {
                    [mType]: mKey
                },
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

    
    async generate_evaluator(props: components["schemas"]["EvaluatorSpecRequest"]): Promise<components["schemas"]["EvaluatorGenerateResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.POST("/v0/evaluator_generate", {
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
        return data as components["schemas"]["EvaluatorGenerateResponse"] || {};
    }


    async upload_evaluator(props: UploadEvaluatorProps): Promise<components["schemas"]["EvaluatorDetailedResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const eLength = this.endpoint.length;
        const api_endpoint = ((this.endpoint.substring(eLength-1) === "/")?this.endpoint.substring(0, eLength-1):this.endpoint)+"/v0/evaluator_upload";
        
        const tmpFileName = "temp_evaluator_code.py";
        const { evaluator_code = "" } = props; // file_path is rewritten as needed
        if (props.file_path && evaluator_code.length > 0) {
            throw new Error("Only one of file_path or evaluator_code is allowed");
        }
        const isGeneratedEval: boolean = (evaluator_code && evaluator_code.length > 0)?true:false;
        if (isGeneratedEval) {
            fs.writeFileSync(tmpFileName, evaluator_code);
            props.file_path = tmpFileName;
        }

        const file_path: string = props.file_path as string; // file_path is rewritten as needed
        if (!fs.existsSync(file_path))
            throw new Error("File not found");
        //const altFile = fs.readFileSync(file_path);
        //console.log("Uploading Eval: "+altFile.toString().substring(0, 75)+"...");

        const file = fs.createReadStream(file_path);
        if (!file)
            throw new Error("File read error");

        const requires_scenario_input: string = (props.requires_scenario_input && props.requires_scenario_input.toString() === "true")?"true":"false";
        const requires_scenario_result: string = (props.requires_scenario_result && props.requires_scenario_result.toString() === "true")?"true":"false";
        const form = new FormData();
        form.append("name", props.name);
        form.append("project_id", props.project_id); 
        form.append("description", props.description); 
        form.append("requires_scenario_input", requires_scenario_input); 
        form.append("requires_scenario_result", requires_scenario_result); 
        form.append("output_data_type", props.output_data_type); 
        form.append(
            'file', file
        );
        const headers = Object.assign({
            'api-key': `${this.api_key}`,
        }, form.getHeaders());
        
        const reqOptions = {
            method: 'POST',
            headers: headers,
            'body':form, // eslint-disable-line quote-props
        };
        
        return fetch(`${api_endpoint}`, reqOptions)
            .then(response => response.json())
            .then((data: any) => {
                if (data.detail) {
                    throw new Error(data.detail);
                } else {
                    if (data && data.warning) {
                        console.log(data.warning);
                    }
                    return data as components["schemas"]["EvaluatorGenerateResponse"];
                }
            })
            .finally(() => {
                if (isGeneratedEval && fs.existsSync(tmpFileName)) {
                    fs.unlinkSync(tmpFileName);
                }
            })
            .catch((error) => {
                console.error(error);
                throw error;
            });
    }

    async get_all_evaluators(): Promise<components["schemas"]["EvaluatorBriefResponse"][]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/evaluators", {
            params: {
                header: {
                    "api-key": this.api_key
                },
            }
        });
        if (error) {
            throw error;
        }
        return data || {};
    }

    async get_evaluator(evaluator_id: string): Promise<components["schemas"]["EvaluatorDetailedResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/evaluator/{evaluator_id}", {
            params: {
                header: {
                    "api-key": this.api_key
                },
                path: { evaluator_id: evaluator_id }
            }
        });
        if (error) {
            throw error;
        }
        return data || {};
    }


}
