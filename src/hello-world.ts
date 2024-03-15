import createClient from "openapi-fetch";
import type { paths, components } from "./api/v1";



/**
 * say hi to people.
 * @param {string} name
 * @returns {void}
 */
export async function getProjects(key: string): Promise<any[]> {
    const client = createClient<paths>({ baseUrl: "http://localhost:8000/" });
    
    const { data, error } = await client.GET("/v0/projects", {
        params: {
            header: {
                "api-key": key
            }
        }
    });
    if (data) {
        return  data;
    }
    return [];
}

/**
 * say hi to people.
 * @param {string} name
 * @returns {void}
 */
export function outputMessage(name: string) {
    console.log(`Hi, ${name}`);
}

/**
 * say hi to people.
 * @param {string} name
 * @returns {string}
 */
export function getMessage(name: string): string {
    outputMessage(name);
    return `Hi, ${name}`;
}
