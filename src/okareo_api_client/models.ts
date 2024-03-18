import { compileFunction } from "vm";
import type { paths, components } from "../api/v1/okareo_endpoints";

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
    api_key?: string;
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
    if (!props.api_key) { props.api_key = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>" }
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
    if (!props.api_key) { props.api_key = process.env.COHERE_API_KEY || "<YOUR_OPENAI_KEY>" }
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