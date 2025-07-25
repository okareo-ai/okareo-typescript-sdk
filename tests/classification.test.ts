import { getProjectId } from "./utils/setup-env";
import { Okareo, OpenAIModel, TestRunType } from "../src";
import { uniqueName } from "./utils/test-utils";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";

let project_id: string;

const TEST_SEED_DATA = [
    {
        input: "Can I connect to my SalesForce?",
        result: "Technical Support",
    },
    {
        input: "Do you have a way to send marketing emails?",
        result: "Technical Support",
    },
    {
        input: "Can I get invoiced instead of using a credit card?",
        result: "Billing",
    },
    {
        input: "My CRM integration is not working.",
        result: "Technical Support",
    },
    {
        input: "Do you have SOC II type 2 certification?",
        result: "Account Management",
    },
    {
        input: "I like the product. Please connect me to your enterprise team.",
        result: "General Inquiry",
    },
];

const USER_PROMPT_TEMPLATE = `{scenario_input}`;

const CLASSIFICATION_CONTEXT_TEMPLATE = `
You will be provided a question from a customer.
Classify the question into a customer category and sub-category.
Provide the output with only the category name.

Categories: Technical Support, Billing, Account Management, General Inquiry, Unknown

Sub-Categories for Technical Support:
Troubleshooting
Product features
Product updates
Integration options
Found a problem

Sub-Categories for Billing:
Unsubscribe
Upgrade
Explain my bill
Change payment
Dispute a charge

Sub-Categories for Account Management:
Add a team member
Change or Update details
Password reset
Close account
Security

Sub-Categories for General Inquiry:
Contact sales
Product information
Pricing
Feedback
Speak to a human
`;

describe("Evaluations", () => {
    beforeAll(async () => {
        project_id = await getProjectId();
    });

    test("Classification", async () => {
        const okareo = new Okareo({ api_key: OKAREO_API_KEY });
        const sData: any = await okareo.create_scenario_set({
            name: uniqueName("CI Small Class Scenario Set"),
            project_id: project_id,
            seed_data: TEST_SEED_DATA,
        });

        const model = await okareo.register_model({
            name: uniqueName("CI: Classification Model"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id: project_id,
            models: {
                type: "openai",
                model_id: "gpt-3.5-turbo",
                temperature: 0.5,
                system_prompt_template: CLASSIFICATION_CONTEXT_TEMPLATE,
                user_prompt_template: USER_PROMPT_TEMPLATE,
            } as OpenAIModel,
            update: true,
        });

        const data = await model.run_test({
            model_api_key: OPENAI_API_KEY,
            name: uniqueName("CI: Classification Run"),
            tags: ["TS-SDK", "CI", "Testing"],
            project_id: project_id,
            scenario_id: sData.scenario_id,
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        });

        expect(data).toBeDefined();
    });
});
