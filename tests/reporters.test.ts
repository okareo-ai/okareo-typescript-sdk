import { components } from '../dist';
import { ClassificationReporter, GenerationReporter, RetrievalReporter } from '../dist';
import { TestRunType, EvaluationHistoryReporter } from '../dist';

const TEST_RUN_CLASSIFICATION: any = {
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
            'General Inquiry': { precision: .5, recall: 0.5, f1: 0.5 },
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

const TEST_RUN_RETRIEVAL: any = {
    id: 'd883dd1f-5119-4b86-8b85-b038c6cdb9e0',
    project_id: '5ff115a2-f4b0-4100-bbde-87a54428add4',
    mut_id: 'f9f2f78e-c826-418c-893a-005838ef22d4',
    scenario_set_id: '85997425-ad74-4284-b525-3ae3632ce949',
    name: 'Retrieval Test Run 01-13 07:17:41',
    tags: [],
    type: 'INFORMATION_RETRIEVAL',
    start_time: '2024-01-13T15:17:42.483986',
    end_time: '2024-01-13T15:17:42.632510',
    test_data_point_count: 20,
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
    },
    error_matrix: [],
    app_link: 'https://app.okareo.com/project/5ff115a2-f4b0-4100-bbde-87a54428add4/eval/d883dd1f-5119-4b86-8b85-b038c6cdb9e0'
}; 


const TEST_RUN_GENERATION: any = {
    id: 'af197dd9-8d93-4ae3-9407-d0e19050bd44',
    project_id: '5ff115a2-f4b0-4100-bbde-87a54428add4',
    mut_id: '374b760a-ddf3-4295-aa41-57f6da65b67f',
    scenario_set_id: 'c6a6d412-734f-4799-8dc6-667aa75a8e30',
    name: 'CLI Evaluation-078355E56D - EVAL',
    tags: [],
    type: 'NL_GENERATION',
    start_time: '2024-03-19T16:27:37.171934',
    end_time: '2024-03-19T16:28:06.531265',
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
    app_link: 'https://app.okareo.com/project/5ff115a2-f4b0-4100-bbde-87a54428add4/eval/af197dd9-8d93-4ae3-9407-d0e19050bd44'
} 


describe('Reporters', () => {
    test('Classification Reporter', async () =>  {
      const metrics = {
            error_max: 8, 
            metrics_min: {
                precision: 0.7,
                recall: 0.8,
                f1: 0.7,
                accuracy: 0.8
            }
        }

      const reporter = new ClassificationReporter({
        eval_run:TEST_RUN_CLASSIFICATION as components["schemas"]["TestRunItem"], 
        ...metrics,
      });
      reporter.log();

      expect(reporter.pass).toBeTruthy();
    });


    test('Retrieval Reporter', async () =>  {
        const metrics = {
          metrics_min: {
            'Accuracy@k': {
                value: 0.99,
                at_k: 3
            },
            'Precision@k': {
                value: 0.99,
                at_k: 3
            },
            'Recall@k': {
                value: 0.8,
                at_k: 3
            },
            'NDCG@k': {
                value: 0.2,
                at_k: 3
            },
            'MRR@k': {
                value: 0.99,
                at_k: 3
            },
            'MAP@k': {
                value: 0.99,
                at_k: 3
            }
          },

          metrics_max: {
            'Precision@k': {
                value: 0.2,
                at_k: 1
            },
          }
        }

        const reporter = new RetrievalReporter({
          eval_run:TEST_RUN_RETRIEVAL as components["schemas"]["TestRunItem"], 
          ...metrics,
        });
        reporter.log();
        
        expect(reporter.report.errors).toBeGreaterThanOrEqual(2);
    });


    test('Generation Reporter', async () =>  {
        const metrics = {
          metrics_min: {
              coherence: 5,
              consistency: 3,
              fluency: 5,
              relevance: 1,
              overall: 2
          }
        };

        const reporter = new GenerationReporter({
          eval_run:TEST_RUN_GENERATION as components["schemas"]["TestRunItem"], 
          ...metrics,
        });
        reporter.log();
        
        expect(reporter.report.errors).toBeGreaterThanOrEqual(2);
    });


    test('Generations History', async () =>  {
        const metrics = {
          metrics_min: {
              coherence: 5,
              consistency: 3,
              fluency: 5,
              relevance: 1,
              overall: 2
          },
          metrics_max: {
              coherence: 5,
              consistency: 3,
              fluency: 5,
              relevance: 1,
              overall: 2
          }
        };

        const class_metrics = {
          metrics_min: {
            precision: 1.0,
            recall: 1.0,
            f1: 0.6,
            accuracy: 0.6
          },
          metrics_max: {
            precision: 0.9,
            recall: 1.0,
            f1: 0.8,
            accuracy: 0.99
          }
        };

        const retrieval_metrics = {
          metrics_min: {
            'Accuracy@k': {
                value: 0.85,
                at_k: 1
            },
            'Precision@k': {
                value: 0.6,
                at_k: 3
            },
            'Recall@k': {
                value: 0.9,
                at_k: 1
            },
            'NDCG@k': {
                value: 0.2,
                at_k: 3
            },
            'MRR@k': {
                value: 0.99,
                at_k: 3
            },
            'MAP@k': {
                value: 0.99,
                at_k: 3
            }
          },

          metrics_max: {
            'Accuracy@k': {
                value: 0.9,
                at_k: 1
            },
            'Precision@k': {
                value: 0.9,
                at_k: 3
            },
          }
        }

        const history_class = new EvaluationHistoryReporter(
          {
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
            evals:[TEST_RUN_CLASSIFICATION as components["schemas"]["TestRunItem"], TEST_RUN_CLASSIFICATION as components["schemas"]["TestRunItem"]],
            assertions: class_metrics,
            last_n: 5,
          }
        );
        history_class.log();
        expect(history_class.last_n).toBeGreaterThanOrEqual(5);


        const history_retrieve = new EvaluationHistoryReporter(
          {
            type: TestRunType.INFORMATION_RETRIEVAL,
            evals:[TEST_RUN_RETRIEVAL as components["schemas"]["TestRunItem"], TEST_RUN_RETRIEVAL as components["schemas"]["TestRunItem"]],
            assertions: retrieval_metrics,
            last_n: 5,
          }
        );
        history_retrieve.log();
        expect(history_class.last_n).toBeGreaterThanOrEqual(5);


        const history_gen = new EvaluationHistoryReporter(
          {
            type: TestRunType.NL_GENERATION,
            evals:[TEST_RUN_GENERATION as components["schemas"]["TestRunItem"], TEST_RUN_GENERATION as components["schemas"]["TestRunItem"]], 
            assertions: metrics,
          }
        );
        history_gen.log();
        expect(history_gen.last_n).toBeGreaterThanOrEqual(10);
    });

});




