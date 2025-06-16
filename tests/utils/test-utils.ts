import { Okareo } from "../../src";

export const UNIQUE_BUILD_ID = process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`;

export async function waitForRunToFinish(okareo: Okareo, runId: string, timeoutMs = 30000, pollIntervalMs = 1000) {
    const start = Date.now();
    let run = await okareo.get_test_run(runId);

    while (run.status !== "FINISHED") {
        if (Date.now() - start > timeoutMs) {
            throw new Error(`Test run ${runId} did not finish within ${timeoutMs / 1000} seconds`);
        }
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        run = await okareo.get_test_run(runId);
    }

    return run;
}

export function uniqueName(prefix: string) {
    return `${prefix} - ${UNIQUE_BUILD_ID} - ${Date.now()}`;
}
