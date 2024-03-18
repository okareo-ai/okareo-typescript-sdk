import { components } from '../src/api/v1';
import { Okareo } from '../src/index';
import { classification_reporter } from '../src/reporters';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OKAREO_BASE_URL = process.env.OKAREO_BASE_URL || "https://api.okareo.com/";
const TEST_RUN_ITEM: any = {
    id: '2eed4076-fd4e-484d-928c-c56d5a4ed4fc',
    project_id: '5ff115a2-f4b0-4100-bbde-87a54428add4',
    mut_id: '888228a5-8a4b-44cd-ba27-8d09e66d2ae5',
    scenario_set_id: 'd242f8e5-400a-4907-bf16-7c7f438cfa21',
    name: 'TS-SDK Classification',
    tags: [],
    type: 'MULTI_CLASS_CLASSIFICATION',
    start_time: '2024-03-18T15:24:59.933516',
    end_time: '2024-03-18T15:25:03.892638',
    test_data_point_count: 6,
    model_metrics: {
        weighted_average: {
            precision: 0.7083333333333334,
            recall: 0.8333333333333334,
            f1: 0.7619047619047619,
            accuracy: 0.8333333333333334
        },
        scores_by_label: {
            'Account Management': { precision: 0, recall: 0, f1: 0 },
            'Technical Support': { precision: 0.75, recall: 1, f1: 0.8571428571428571 },
            'General Inquiry': { precision: 1, recall: 1, f1: 1 },
            'Billing': { precision: 1, recall: 1, f1: 1 }
        }
    },
    error_matrix: [
        { 'Account Management': [ 0, 0, 0, 1 ] },
        { 'Billing': [ 0, 1, 0, 0 ] },
        { 'General Inquiry': [ 0, 0, 1, 0 ] },
        { 'Technical Support': [ 0, 0, 0, 3 ] }
    ],
    app_link: 'https://app.okareo.com/project/5ff115a2-f4b0-4100-bbde-87a54428add4/eval/2eed4076-fd4e-484d-928c-c56d5a4ed4fc'
  };

describe('Evaluations', () => {
    test('E2E Generation Evaluation', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        //const tData = await okareo.get_test_run(eval_id);
        const report = classification_reporter(
            {
                testRunItem:TEST_RUN_ITEM as components["schemas"]["TestRunItem"], 
                error_max: 8, 
                metrics_min: {
                    precision: 0.7,
                    recall: 0.8,
                    f1: 0.7,
                    accuracy: 0.8
                }
            }
        );
        if (!report.pass) {
            console.log(report);
        }
        expect(report.pass).toBeTruthy();
    });

});




