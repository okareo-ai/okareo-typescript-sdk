import createClient from "openapi-fetch";
import type { paths, components } from "./api/v1";

export class Okareo {
    api_key: string = '';
    constructor(api_key: string) {
        this.api_key = api_key;
    }

    /**
     * say hi to people.
     * @param {string} name
     * @returns {void}
     */
    async getProjects(): Promise<any[]> {
        const client = createClient<paths>({ baseUrl: "http://localhost:8000/" });
        
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
}
