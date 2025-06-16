import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Okareo, CheckCreateUpdateProps, CheckOutputType } from "../src";
import { getProjectId } from "./utils/setup-env";
import { uniqueName } from "./utils/test-utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
let project_id: string;

describe("Checks", () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    test("Generate a Check", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const check_info = {
            name: uniqueName("CI: Generate Check"),
            project_id,
            description: "Fail the test if the output is more than 10% longer than the expected result.",
            requires_scenario_input: false,
            requires_scenario_result: true,
            output_data_type: "bool",
        };
        const check: any = await okareo.generate_check(check_info);
        expect(check.generated_code).toBeDefined();
    });

    test("Upload a Code-based Check", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const filePath = join(__dirname, "./fixtures/example_eval.py");
        const code_contents = readFileSync(filePath, "utf8");
        const check_config = {
            code_contents,
            type: CheckOutputType.PASS_FAIL,
        };
        const check_info = {
            project_id,
            name: uniqueName("CI: Uploaded Code-based Check"),
            description: "Pass if the model result length is within 10% of the expected result.",
            check_config,
        } as CheckCreateUpdateProps;
        const upload_check: any = await okareo.create_or_update_check(check_info);

        expect(upload_check).toBeDefined();
    });

    test("Upload a Model-based Check", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const prompt = "Only output True if the model_output is at least 20 characters long, otherwise return False.";
        const check_config = {
            prompt_template: prompt,
            type: CheckOutputType.PASS_FAIL,
        };
        const check_info = {
            project_id,
            name: uniqueName("CI: Uploaded Model-based Check"),
            description: prompt,
            check_config,
        } as CheckCreateUpdateProps;
        const upload_check: any = await okareo.create_or_update_check(check_info);

        expect(upload_check).toBeDefined();
    });

    test("Get Check(s)", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const allEvals = await okareo.get_all_checks();
        expect(allEvals).toBeDefined();
        let evalObj: unknown;
        if (allEvals.length > 0) {
            const eval_id = allEvals[0].id;
            evalObj = eval_id ? await okareo.get_check(eval_id) : null;
        }
        expect(evalObj).toBeDefined();
    });
});
