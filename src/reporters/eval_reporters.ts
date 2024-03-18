import { error } from "console";
import type { paths, components } from "../api/v1";

/*
    model_metrics {
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
        Billing: { precision: 1, recall: 1, f1: 1 }
      }
    }

      at log (src/reporters/eval_reporters.ts:13:13)

  console.log
    error_matrix [
      { 'Account Management': [ 0, 0, 0, 1 ] },
      { Billing: [ 0, 1, 0, 0 ] },
      { 'General Inquiry': [ 0, 0, 1, 0 ] },
      { 'Technical Support': [ 0, 0, 0, 3 ] }
    ]
*/
interface ClassificationReporterProps {
    testRunItem: components["schemas"]["TestRunItem"];
    error_max?: number;
    metrics_min?: {[key: string]: number};
}
interface ClassificationReporterResponse {
    pass: boolean;
    errors: number;
    fail_metrics: {
        [key: string]: {
            metric: string;
            value: number;
            expected: number;
        }
    };
}
export const classification_reporter = (props: ClassificationReporterProps): ClassificationReporterResponse => {
    const { testRunItem, metrics_min, error_max = 0 } = props;
    const { model_metrics, error_matrix } = testRunItem;
    if (!model_metrics || !error_matrix) {
        throw new Error("Invalid Classification TestRunItem");
    }
    const fail_metrics: any = {};
    let pass = true;
    if (metrics_min) {
        for (const key in metrics_min) {
            if (model_metrics.weighted_average[key] < metrics_min[key]) {
                fail_metrics[key] = {
                    metric: key,
                    value: model_metrics.weighted_average[key],
                    expected: metrics_min[key],
                }
                pass = false;
            }
        }
    }
    let error_count: number = 0;
    error_matrix.map((row: any) => {
        for (const key in row) {
            const row_errors: number = row[key].reduce((a: number, b: number) => a + b, 0);
            error_count += row_errors;
        }
    });
    if (error_count > error_max) {
        pass = false;
    }
    return {
        pass: pass,
        errors: error_count,
        fail_metrics: fail_metrics,
    };
}