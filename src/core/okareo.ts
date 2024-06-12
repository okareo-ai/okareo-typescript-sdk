import createClient from 'openapi-fetch';
import fetch from 'node-fetch';
import type { paths, components } from "../api/v1/okareo_endpoints";
import FormData from "form-data";
import * as fs from "fs";
import { ModelUnderTest, BaseModel, CustomModel } from "./models";

const CHECK_DEPRECATION_WARNING = "The `evaluator` naming convention is deprecated and will not be supported in a future release. " +
"Please use `check` in place of `evaluator` when invoking this method.";

export interface OkareoProps {
    api_key: string;
    endpoint?: string;
   // project_id?: string | undefined;
}

export interface UploadScenarioSetProps {
    project_id: string;
    scenario_name?: string;
    name?: string;
    file_path: string;
}


export interface UploadEvaluatorProps {
    project_id: string;
    name: string;
    description: string;
    file_path?: string;
    generated_code?: string;
    requires_scenario_input?: boolean;
    requires_scenario_result?: boolean;
    output_data_type: string; // "bool" | "int" | "float";
    update?: boolean;
}

export interface CreateProjectProps {
    name: string;
    tags?: string[];
}

export interface UpdateProjectProps extends CreateProjectProps {
    project_id: string;
}

export interface RegisterModelProps {
    name: string;
    tags?: string[];
    project_id: string;
    models: BaseModel | BaseModel[];
    update?: boolean;
}


export interface CreateScenarioProps {
    name: string;
    project_id: string;
    seed_data: {
        input: Record<string, any> | unknown[] | string;
        result: Record<string, any> | unknown[] | string;
    }[];
}

/**
 * Okareo SDK
 * The Okareo class is the main entry point for the Okareo SDK.
 * It provides methods for registering models, finding test runs, and creating projects.
 */
export class Okareo {
    api_key: string = '';
    endpoint: string = '';

    constructor(props: OkareoProps) {
        if (!props.api_key || props.api_key.length === 0) { throw new Error("API Key is required"); }
        const base_endpoint = process.env.OKAREO_BASE_URL || "https://api.okareo.com/";
        const { api_key, endpoint = base_endpoint /*, project_id */ } = props;
        this.api_key = api_key;
        this.endpoint = endpoint;
        //this.project_id = project_id;
    }

    /**
     * Register a model with Okareo. Models can be registered with a project and tags.
     * Thee are multiple models that can be registered and used for evaluation.
     * The model types include CustomModel, OpenAIModel, CohereModel, PineconeDB, and QDrant
     * Models are only updated if the update flag is set to true.
     * @param props 
     * @returns 
     */
    async register_model(props: RegisterModelProps): Promise<ModelUnderTest> {

        const models = Array.isArray(props.models) ? props.models : [props.models];
        let modelInvoker: any = null;
        
        const register_payload: any = JSON.parse(JSON.stringify(props)); // Create a deep clone of props 
        register_payload["models"] = {};
        for (let model of models) {
            register_payload["models"][model.type] = model
            delete register_payload["models"][model.type].type;
        }
        if ("custom" in register_payload["models"]) {
            modelInvoker = (register_payload["models"]["custom"] as CustomModel).invoke
            delete (register_payload["models"]["custom"] as CustomModel).invoke;
        }

        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data: response, error } = await client.POST("/v0/register_model", {
            params: {
                header: {
                    "api-key": this.api_key
                },
            },
            body: register_payload
        });
        if (error) {
            throw error;
        }
        if (response && response.warning) {
            console.log(response.warning);
        }
        if (!response.id) {
            throw new Error("Model registration failed");
        }

        if (modelInvoker && response.models && response.models.custom) {
            (response.models.custom as any).invoke = modelInvoker;
        }

        return new ModelUnderTest({
            api_key: this.api_key,
            endpoint: this.endpoint,
            mut: response as components["schemas"]["ModelUnderTestResponse"],
        });

    } 

    async find_test_runs(find_runs: components["schemas"]["GeneralFindPayload"]): Promise<components["schemas"]["TestRunItem"][]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.POST("/v0/find_test_runs", {
            params: {
                header: {
                    "api-key": this.api_key
                },
            },
            body: find_runs
        });
        if (error) {
            throw error;
        }
        return data || [];
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

    async updateProject(props: UpdateProjectProps): Promise<components["schemas"]["ProjectResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { project_id, name, tags = [] } = props
        const body: { name: string, tags: string[] } = {
            name: name,
            tags: tags
        };
        const { data, error } = await client.PUT("/v0/projects/{project_id}", {
            params: {
                header: {
                    "api-key": this.api_key
                },
                path: { project_id: project_id }
            },
            body: body
        });
        if (error) {
            throw error;
        }
        return data || [];
    }

    async createProject(props: CreateProjectProps): Promise<components["schemas"]["ProjectResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { name, tags = [] } = props
        const body: { name: string, tags: string[]} = {
            name, tags
        }
        const { data, error } = await client.POST("/v0/projects", {
            params: {
                header: {
                    "api-key": this.api_key
                }
            },
            body: body
        });
        if (error) {
            throw error;
        }
        return data || [];
    }

    async create_scenario_set(props: CreateScenarioProps): Promise<components["schemas"]["ScenarioSetResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const create_scenario_payload: any = JSON.parse(JSON.stringify(props));
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.POST("/v0/scenario_sets", {
            params: {
                header: {
                    "api-key": this.api_key
                },
            },
            body: create_scenario_payload
            
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

    async get_scenario_sets(props: { project_id: string, scenario_id?:string} ): Promise<components["schemas"]["ScenarioSetResponse"][]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const { project_id, scenario_id = "" } = props;
        const query: { project_id: string, scenario_id?:string } = {
            project_id
        }
        if (scenario_id.length > 0) { query.scenario_id = scenario_id; }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/scenario_sets", {
            params: {
                header: {
                    "api-key": this.api_key
                },
                query
            }
        });
        if (error) {
            throw error;
        }
        return data || [];
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

            if (props.scenario_name && props.scenario_name.length > 0) { 
                console.log("Warning: deprecated property.  Please use 'name' instead."); 
                props.name = props.scenario_name;
            }
            const { name = props.scenario_name } = props;

            const form = new FormData();
            form.append("name", name);
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
                'body':form,
            };
            
            return fetch(`${api_endpoint}`, reqOptions)
                .then(response => response.json())
                // eslint-disable-next-line  @typescript-eslint/no-explicit-any
                .then((data: any) => {
                    if (data && data.warning) {
                        console.log(data.warning);
                    }
                    return data;
                })
                .finally(() => {
                    file.close();
                })
                .catch((error) => {
                    console.error(error);
                    throw error;
                });
    }

    //

    async get_all_models(project_id: string ): Promise<components["schemas"]["ModelUnderTestResponse"][]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/models_under_test", {
            params: {
                header: {
                    "api-key": this.api_key
                },
                query: {
                    project_id: project_id
                }
            }
        });
        if (error) {
            throw error;
        }
        return data || [];
    }

    async get_model(mut_id: string ): Promise<components["schemas"]["ModelUnderTestResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/models_under_test/{mut_id}", {
            params: {
                header: {
                    "api-key": this.api_key
                },
                path: { mut_id: mut_id }
            }
        });
        if (error) {
            throw error;
        }
        return data || {};
    }

    
    async generate_check(props: components["schemas"]["EvaluatorSpecRequest"]): Promise<components["schemas"]["EvaluatorGenerateResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.POST("/v0/check_generate", {
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


    async generate_evaluator(props: components["schemas"]["EvaluatorSpecRequest"]): Promise<components["schemas"]["EvaluatorGenerateResponse"]> {
        console.warn(CHECK_DEPRECATION_WARNING);
        return this.generate_check(props);
    }


    async upload_check(props: UploadEvaluatorProps): Promise<components["schemas"]["EvaluatorDetailedResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const eLength = this.endpoint.length;
        const api_endpoint = ((this.endpoint.substring(eLength-1) === "/")?this.endpoint.substring(0, eLength-1):this.endpoint)+"/v0/check_upload";
        
        const tmpFileName = "temp_evaluator_code.py";
        const { generated_code = "" } = props; // file_path is rewritten as needed
        if (props.file_path && generated_code.length > 0) {
            throw new Error("Only one of file_path or evaluator_code is allowed");
        }
        const isGeneratedEval: boolean = (generated_code && generated_code.length > 0)?true:false;
        if (isGeneratedEval) {
            fs.writeFileSync(tmpFileName, generated_code);
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
        const update: string = (props.update && props.update.toString() === "true")?"true":"false";
        const form = new FormData();
        form.append("name", props.name);
        form.append("project_id", props.project_id); 
        form.append("description", props.description); 
        form.append("requires_scenario_input", requires_scenario_input); 
        form.append("requires_scenario_result", requires_scenario_result); 
        form.append("output_data_type", props.output_data_type); 
        form.append("update", update);
        form.append(
            'file', file
        );
        const headers = Object.assign({
            'api-key': `${this.api_key}`,
        }, form.getHeaders());
        
        const reqOptions = {
            method: 'POST',
            headers: headers,
            'body':form,
        };

        return await fetch(`${api_endpoint}`, reqOptions)
            .then(response => response.json())
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
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
                file.close();
                if (isGeneratedEval && fs.existsSync(tmpFileName)) {
                    fs.unlinkSync(tmpFileName);
                }
            })
            .catch((error) => {
                console.error("Error uploading check:" + error);
                throw error;
            });
    }


    async upload_evaluator(props: UploadEvaluatorProps): Promise<components["schemas"]["EvaluatorDetailedResponse"]> {
        console.warn(CHECK_DEPRECATION_WARNING);
        return this.upload_check(props);
    }


    async get_all_checks(): Promise<components["schemas"]["EvaluatorBriefResponse"][]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/checks", {
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


    async get_all_evaluators(): Promise<components["schemas"]["EvaluatorBriefResponse"][]> {
        console.warn(CHECK_DEPRECATION_WARNING);
        return this.get_all_checks();
    }


    async get_check(check_id: string): Promise<components["schemas"]["EvaluatorDetailedResponse"]> {
        if (!this.api_key || this.api_key.length === 0) { throw new Error("API Key is required"); }
        const client = createClient<paths>({ baseUrl: this.endpoint });
        const { data, error } = await client.GET("/v0/check/{check_id}", {
            params: {
                header: {
                    "api-key": this.api_key
                },
                path: { check_id: check_id }
            }
        });
        if (error) {
            throw error;
        }
        return data || {};
    }


    async get_evaluator(evaluator_id: string): Promise<components["schemas"]["EvaluatorDetailedResponse"]> {
        console.warn(CHECK_DEPRECATION_WARNING);
        return this.get_check(evaluator_id);
    }

    async delete_check(check_id: string, check_name: string): Promise<string> {
        const eLength = this.endpoint.length;
        const api_endpoint = ((this.endpoint.substring(eLength-1) === "/")?this.endpoint.substring(0, eLength-1):this.endpoint)+"/v0/check/"+check_id;

        const form = new FormData();
        form.append("name", check_name);
        const headers = Object.assign({
            'api-key': `${this.api_key}`,
        }, form.getHeaders());

        const reqOptions = {
            method: 'DELETE',
            headers: headers,
            'body':form,
        };

        return await fetch(`${api_endpoint}`, reqOptions)
            .then(response => {
                if (response.status !== 204) {
                    console.log('error deleting check');
                    throw new Error(`Check deletion failed with code ${response.status}`);
                }
                return  "Check deletion was successful";
            })
            .catch((error) => {
                console.error("Error deleting check: " + error);
                throw error;
            });
            
    }

    async delete_evaluator(evaluator_id: string, evaluator_name: string): Promise<string> {
        console.warn(CHECK_DEPRECATION_WARNING);
        return await this.delete_check(evaluator_id, evaluator_name);
    }

}
