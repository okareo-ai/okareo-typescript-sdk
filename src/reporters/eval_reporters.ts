import type { components } from "../api/v1/okareo_endpoints";


export type IFailMetricItem = {
    metric: string,
    value: number,
    expected: number,
    k?: number;
}
export type IFailMetrics = {
    [key: string]: IFailMetricItem
}


/**
 * Properties to call the classification_reporter function
 */
export interface ClassificationReporterProps {
    eval_run: components["schemas"]["TestRunItem"];
    error_max?: number;
    metrics_min?: {[key: string]: number};
}
/**
 * Standard response form the classification reporter 
 */
export interface ClassificationReporterResponse {
    pass: boolean;
    errors: number;
    fail_metrics: IFailMetrics;
}

/**
 * Classification error matrix
 * error_matrix: [
        { 'Account Management': [ 0, 0, 0, 1 ] },
        { 'Billing': [ 0, 1, 0, 0 ] },
        { 'General Inquiry': [ 0, 0, 1, 0 ] },
        { 'Technical Support': [ 0, 0, 0, 3 ] }
    ]
 */

type ErrorMatrixRow = {[key: string]: number[]};

/**
 * Convenience function to evaluate a classification test run
 * @param props ClassificationReporterProps
 * @returns 
 */
export const classification_reporter = (props: ClassificationReporterProps): ClassificationReporterResponse => {
    const { eval_run, metrics_min, error_max = 0 } = props;
    const { model_metrics, error_matrix } = eval_run;
    if (!model_metrics || !error_matrix) {
        throw new Error("Invalid Classification eval_run");
    }
    const fail_metrics: IFailMetrics = {};
    let pass:boolean = true;
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
    let error_index: number = 0;
    error_matrix.map((row: unknown) => {
        let row_index = 0;
        for (const key in row as ErrorMatrixRow) {
            const row_errors: number = (row as ErrorMatrixRow)[key].reduce((a: number, b: number) => {
                let result: number = a;
                if (row_index !== error_index) 
                    result = a + b;
                row_index++;
                return result;
            }, 0);
            error_count += row_errors;
        }
        error_index++;
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


/*
// GENERATION
{
    ...
    test_data_point_count: 3,
    model_metrics: {
      mean_scores: {
        coherence: 3.6041134314518946,
        consistency: 3.6666003818872697,
        fluency: 2.0248845922814245,
        relevance: 2.3333201448723386,
        overall: 2.907229637623232
      },
      scores_by_row: [
        {
          scenario_index: 1,
          coherence: 4.999831347314708,
          consistency: 4.999918368197127,
          fluency: 0,
          relevance: 4.998501009778189,
          overall: 3.749562681322506,
          test_id: '6b7cbe8d-c653-4dce-8de9-137a61566876'
        },
        {
          scenario_index: 2,
          coherence: 1,
          consistency: 1.000000023588648,
          fluency: 3,
          relevance: 1.0000000195556844,
          overall: 1.500000010786083,
          test_id: 'd3dac533-334a-4c61-8495-08d7c82bcfcf'
        },
        {
          scenario_index: 3,
          coherence: 4.812508947040976,
          consistency: 4.999882753876036,
          fluency: 3.0746537768442743,
          relevance: 1.001459405283143,
          overall: 3.472126220761107,
          test_id: 'bd40e350-5af3-4ccf-861c-d1a1889ed889'
        }
    ]
    },
    error_matrix: [],
    ...
} 
*/

export interface GenerationReporterProps {
    eval_run: components["schemas"]["TestRunItem"];
    metrics_min?: {[key: string]: number};
}
export interface GenerationReporterResponse {
    pass: boolean;
    errors: number;
    fail_metrics: IFailMetrics;
}

export const generation_reporter = (props: GenerationReporterProps): GenerationReporterResponse => {
    const { eval_run, metrics_min } = props;
    const { model_metrics } = eval_run;
    if (!(model_metrics)) {
        throw new Error("Invalid Generation TestRunItem");
    }
    const fail_metrics: IFailMetrics = {};
    let errors: number = 0;
    let pass = true;
    if (metrics_min) {
        for (const key in metrics_min) {
            if (model_metrics.mean_scores[key] < metrics_min[key]) {
                errors++;
                fail_metrics[key] = {
                    metric: key,
                    value: model_metrics.mean_scores[key],
                    expected: metrics_min[key],
                }
                pass = false;
            }
        }
    }
    
    return {
        pass: pass,
        errors: errors,
        fail_metrics: fail_metrics,
    };
}


/*
 model_metrics: {
      'Accuracy@k': {
        '1': 0.8,
        '2': 0.9,
        '3': 1,
        '4': 1,
        '5': 1,
        '6': 1,
        '7': 1,
        '8': 1,
        '9': 1,
        '10': 1
      },
      'Precision@k': {
        '1': 0.8,
        '2': 0.45,
        '3': 0.33333333333333326,
        '4': 0.25,
        '5': 0.20000000000000004,
        '6': 0.16666666666666663,
        '7': 0.14285714285714285,
        '8': 0.125,
        '9': 0.11111111111111112,
        '10': 0.10000000000000002
      },
      'Recall@k': {
        '1': 0.8,
        '2': 0.9,
        '3': 1,
        '4': 1,
        '5': 1,
        '6': 1,
        '7': 1,
        '8': 1,
        '9': 1,
        '10': 1
      },
      'NDCG@k': {
        '1': 0.8,
        '2': 0.8630929753571458,
        '3': 0.9130929753571457,
        '4': 0.9130929753571457,
        '5': 0.9130929753571457,
        '6': 0.9130929753571457,
        '7': 0.9130929753571457,
        '8': 0.9130929753571457,
        '9': 0.9130929753571457,
        '10': 0.9130929753571457
      },
      'MRR@k': {
        '1': 0.8,
        '2': 0.85,
        '3': 0.8833333333333332,
        '4': 0.8833333333333332,
        '5': 0.8833333333333332,
        '6': 0.8833333333333332,
        '7': 0.8833333333333332,
        '8': 0.8833333333333332,
        '9': 0.8833333333333332,
        '10': 0.8833333333333332
      },
      'MAP@k': {
        '1': 0.8,
        '2': 0.85,
        '3': 0.8833333333333332,
        '4': 0.8833333333333332,
        '5': 0.8833333333333332,
        '6': 0.8833333333333332,
        '7': 0.8833333333333332,
        '8': 0.8833333333333332,
        '9': 0.8833333333333332,
        '10': 0.8833333333333332
      }
      */

export type IMetricMin = {
    value: number;
    at_k: number;
}
export interface RetrievalReporterProps {
    eval_run: components["schemas"]["TestRunItem"];
    metrics_min?: {[key: string]: IMetricMin};
}
export interface RetrievalReporterResponse {
    pass: boolean;
    errors: number;
    fail_metrics: IFailMetrics
}

export const retrieval_reporter = (props: RetrievalReporterProps): RetrievalReporterResponse => {
    const { eval_run, metrics_min } = props;
    const { model_metrics } = eval_run;
    if (!(model_metrics)) {
        throw new Error("Invalid Generation TestRunItem");
    }
    const fail_metrics: IFailMetrics = {};
    let pass = true;
    let errors = 0;

    if (metrics_min) {
        for (const key in metrics_min) {
            const min_item:IMetricMin = metrics_min[key];
            if (model_metrics[key][min_item.at_k] < min_item.value) {
                errors++;
                fail_metrics[key] = {
                    metric: key,
                    k: min_item.at_k,
                    value: model_metrics[key][min_item.at_k],
                    expected: min_item.value,
                }
                pass = false;
            }
        }
    }
    return {
        pass: pass,
        errors: errors,
        fail_metrics: fail_metrics,
    };
}