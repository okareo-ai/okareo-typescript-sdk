import { compileFunction } from "vm";
import type { paths, components } from "../api/v1";

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

interface BaseModel  {
    type?: string | undefined;
}
export interface TOpenAIModel extends BaseModel {
    api_key?: string;
    model_id: string;
    temperature: number;
    system_prompt_template: string;
    user_prompt_template: string;
    api_keys?: any;
}
export interface TCohereModel extends BaseModel {
    api_key: string;
    model_id: string;
    model_type: string;
    input_type: string;
}
export interface TPineconeDB extends BaseModel {
    index_name: string;
    region: string;
    project_id: string;
    top_k: string;
}
export interface TQDrant extends BaseModel {
    collection_name: string;
    url: string;
    top_k: string;
}

export interface ModelUnderTestProps {
    name: string;
    project_id: string;
    tags: string[];
    model: BaseModel;
}
// This is a shim due to the fact that the REST API and SDK are not in sync
// the 
export function ModelUnderTest(props: ModelUnderTestProps): components["schemas"]["ModelUnderTestSchema"] {
    const { model } = props;
    const { type = "unknown" } = model;
    delete model.type;
    return {
        name: props.name,
        tags: props.tags,
        models: {
            [type]: model
        }
    } as components["schemas"]["ModelUnderTestSchema"];
}

export function OpenAIModel(props: TOpenAIModel): TOpenAIModel {
    const { temperature = "0.0", system_prompt_template = "", api_key } = props;
    delete props.api_key;
    return {
        type: "openai",
        ...props,
        temperature,
        system_prompt_template,
        api_keys: {
            openai: api_key
        }
    } as TOpenAIModel;
}

export function CohereModel(props: TCohereModel): TCohereModel {
    return {
        type: "cohere",
        ...props } as TCohereModel;
}

export function PineconeDB(props: TPineconeDB): TPineconeDB {
    return {
        type: "pinecone",
        ...props } as TPineconeDB;
}

export function QDrant(props: TQDrant): TQDrant {
    return {
        type: "qdrant",
        ...props} as TQDrant;
}