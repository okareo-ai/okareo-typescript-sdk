import dotenv from "dotenv";

dotenv.config({ path: ".env", override: true });

import { Okareo } from "../dist";

export async function getProjectId(): Promise<string> {
    const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";

    const okareo = new Okareo({ api_key: OKAREO_API_KEY });
    //const PROJECT_NAME = (process.env.SDK_BUILD_ID)?"TS SDK CI":"TS SDK Local";
    const PROJECT_NAME = "Global"; // this should be modified to fit the above once projects are working
    const pData: any[] = await okareo.getProjects();
    const project_id = pData.find((p) => p.name === PROJECT_NAME)?.id;
    if (!project_id) {
        console.log("Creating project for run.  One time ever.");
        const project: any = okareo.createProject({
            name: PROJECT_NAME,
            tags: ["TS_SDK", "CI"],
        });
        return project.id;
    }
    return project_id;
}
