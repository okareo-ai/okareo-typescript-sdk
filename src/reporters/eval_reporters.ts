import type { components } from "../api/v1/okareo_endpoints";

export type IFailMetricItem = {
  metric: string;
  value: number;
  expected: number;
  k?: number;
};
export type IFailMetrics = {
  [key: string]: IFailMetricItem;
};

const log_report = ({
  eval_run,
  report,
}: {
  eval_run: components["schemas"]["TestRunItem"];
  report: any;
}) => {
  console.log(
    `\nEval: ${eval_run.name} - ${report.pass ? "Pass 🟢" : "Fail 🔴"}`,
  );
  Object.keys(report.fail_metrics).map((m) => {
    const fMetrics: any = report.fail_metrics;
    if (Object.keys(fMetrics[m]).length > 0) {
      console.log(`\nFailures for ${m}`);
      console.table(fMetrics[m]);
    }
  });
  console.log(eval_run.app_link);
};

export interface ClassificationReporterProps {
  eval_run: components["schemas"]["TestRunItem"];
  error_max?: number;
  metrics_min?: { [key: string]: number };
}
export interface ClassificationReporterResponse {
  pass: boolean;
  errors: number;
  fail_metrics: {
    min: IFailMetrics;
  };
}

type ErrorMatrixRow = { [key: string]: number[] };

/**
 * Private. This is a convenience function to evaluate a classification test run
 */
const classification_reporter = (
  props: ClassificationReporterProps,
): ClassificationReporterResponse => {
  const { eval_run, metrics_min, error_max = 0 } = props;
  const { model_metrics, error_matrix } = eval_run;
  if (!model_metrics || !error_matrix) {
    throw new Error("Invalid Classification eval_run");
  }
  const fail_metrics_min: IFailMetrics = {};
  let pass: boolean = true;
  if (metrics_min) {
    const weighted_keys = model_metrics.weighted_average
      ? Object.keys(model_metrics.weighted_average)
      : [];
    if (weighted_keys.length === 0) {
      console.log(
        `WARNING: No weighted average metrics found in "${eval_run.name}". Likely means the model was misconfigured.`,
      );
    } else {
      for (const key in metrics_min) {
        if (model_metrics.weighted_average[key] < metrics_min[key]) {
          fail_metrics_min[key] = {
            metric: key,
            value: model_metrics.weighted_average[key],
            expected: metrics_min[key],
          };
          pass = false;
        }
      }
    }
  }
  let error_count: number = 0;
  let error_index: number = 0;
  error_matrix.map((row: unknown) => {
    let row_index = 0;
    for (const key in row as ErrorMatrixRow) {
      const row_errors: number = (row as ErrorMatrixRow)[key].reduce(
        (a: number, b: number) => {
          let result: number = a;
          if (row_index !== error_index) result = a + b;
          row_index++;
          return result;
        },
        0,
      );
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
    fail_metrics: {
      min: fail_metrics_min,
    },
  };
};

/**
 * Class to report on Classification evaluations.
 * This takes a TestRunItem and evaluates the classification metrics that are provided.
 * @example
 * const classification_reporter = new ClassificationReporter({eval_run: eval_run, error_max: 1, metrics_min: {accuracy: 0.8}});
 */
export class ClassificationReporter {
  eval_run: components["schemas"]["TestRunItem"];
  error_max?: number;
  metrics_min?: { [key: string]: number };
  report: ClassificationReporterResponse;
  pass: boolean;
  static reporter: Function = classification_reporter;

  constructor(props: ClassificationReporterProps) {
    this.eval_run = props.eval_run;
    this.error_max = props.error_max || 0;
    this.metrics_min = props.metrics_min || {};
    this.report = ClassificationReporter.reporter(props);
    this.pass = this.report.pass;
  }

  log() {
    log_report({ eval_run: this.eval_run, report: this.report });
  }
}

export interface GenerationReporterProps {
  eval_run: components["schemas"]["TestRunItem"];
  metrics_min?: { [key: string]: number };
  metrics_max?: { [key: string]: number };
  pass_rate?: { [key: string]: number };
}
export interface GenerationReporterResponse {
  pass: boolean;
  errors: number;
  fail_metrics: {
    min: IFailMetrics;
    max: IFailMetrics;
    pass_rate: IFailMetrics;
  };
}

/**
 * Private. This is a convenience function to evaluate a generation test run
 */
const generation_reporter = (
  props: GenerationReporterProps,
): GenerationReporterResponse => {
  const { eval_run, metrics_min, metrics_max, pass_rate } = props;
  const { model_metrics } = eval_run;
  if (!(model_metrics && model_metrics.mean_scores)) {
    //throw new Error("Invalid Generation TestRunItem");
    console.log("Warning: must be a driver model");
    return {
      pass: true,
      errors: 0,
      fail_metrics: {
        min: {},
        max: {},
        pass_rate: {},
      },
    };
  }
  const fail_metrics_min: IFailMetrics = {};
  const fail_metrics_max: IFailMetrics = {};
  const fail_metrics_pass_rate: IFailMetrics = {};
  let errors: number = 0;
  let pass = true;
  if (metrics_min) {
    for (const key in metrics_min) {
      if (
        model_metrics.mean_scores[key] &&
        model_metrics.mean_scores[key] < metrics_min[key]
      ) {
        errors++;
        fail_metrics_min[key] = {
          metric: key,
          value: model_metrics.mean_scores[key],
          expected: metrics_min[key],
        };
        pass = false;
      }
    }
  }
  if (metrics_max) {
    for (const key in metrics_max) {
      if (
        model_metrics.mean_scores[key] &&
        model_metrics.mean_scores[key] >= metrics_max[key]
      ) {
        errors++;
        fail_metrics_max[key] = {
          metric: key,
          value: model_metrics.mean_scores[key],
          expected: metrics_max[key],
        };
        pass = false;
      }
    }
  }
  if (pass_rate) {
    for (const key in pass_rate) {
      if (
        model_metrics.mean_scores[key] &&
        Number(model_metrics.mean_scores[key]) < Number(pass_rate[key])
      ) {
        errors++;
        fail_metrics_pass_rate[key] = {
          metric: key,
          value: model_metrics.mean_scores[key],
          expected: pass_rate[key],
        };
        pass = false;
      }
    }
  }

  return {
    pass: pass,
    errors: errors,
    fail_metrics: {
      min: fail_metrics_min,
      max: fail_metrics_max,
      pass_rate: fail_metrics_pass_rate,
    },
  };
};

/**
 * Class to report on Generation evaluations.
 * This takes a TestRunItem and evaluates the generation metrics that are provided.
 * @example
 *  const generation_reporter = new GenerationReporter({eval_run: eval_run, metrics_min: {coherence: 3.5}});
 */
export class GenerationReporter {
  eval_run: components["schemas"]["TestRunItem"];
  metrics_min?: { [key: string]: number };
  metrics_max?: { [key: string]: number };
  pass_rate?: { [key: string]: number };
  report: GenerationReporterResponse;
  pass: boolean;
  static reporter: Function = generation_reporter;

  constructor(props: GenerationReporterProps) {
    this.eval_run = props.eval_run;
    this.metrics_min = props.metrics_min || {};
    this.metrics_max = props.metrics_max || {};
    this.pass_rate = props.pass_rate || {};
    this.report = GenerationReporter.reporter(props);
    this.pass = this.report.pass;
  }

  log() {
    log_report({ eval_run: this.eval_run, report: this.report });
  }
}

export type IMetricMin = {
  value: number;
  at_k: number;
};
export interface RetrievalReporterProps {
  eval_run: components["schemas"]["TestRunItem"];
  metrics_min?: { [key: string]: IMetricMin };
}
export interface RetrievalReporterResponse {
  pass: boolean;
  errors: number;
  fail_metrics: {
    min: IFailMetrics;
  };
}

/**
 * Private. This is a convenience function to evaluate a retrieval test run
 */
const retrieval_reporter = (
  props: RetrievalReporterProps,
): RetrievalReporterResponse => {
  const { eval_run, metrics_min } = props;
  const { model_metrics } = eval_run;
  if (!model_metrics) {
    throw new Error("Invalid Generation TestRunItem");
  }
  const fail_metrics_min: IFailMetrics = {};
  let pass = true;
  let errors = 0;

  if (metrics_min) {
    for (const key in metrics_min) {
      const min_item: IMetricMin = metrics_min[key];
      if (
        model_metrics[key] &&
        model_metrics[key][min_item.at_k] < min_item.value
      ) {
        errors++;
        fail_metrics_min[key] = {
          metric: key,
          k: min_item.at_k,
          value: model_metrics[key][min_item.at_k],
          expected: min_item.value,
        };
        pass = false;
      }
    }
  }
  return {
    pass: pass,
    errors: errors,
    fail_metrics: {
      min: fail_metrics_min,
    },
  };
};

/**
 * This is a class to report on Retrieval evaluations.
 * This takes a TestRunItem and evaluates the retrieval metrics that are provided.
 * @example
 *  const retrieval_reporter = new RetrievalReporter({eval_run: eval_run, metrics_min: {NDCG: {value: 0.8, at_k: 1}});
 */
export class RetrievalReporter {
  eval_run: components["schemas"]["TestRunItem"];
  metrics_min?: { [key: string]: IMetricMin };
  report: RetrievalReporterResponse;
  pass: boolean;
  static reporter: Function = retrieval_reporter;

  constructor(props: RetrievalReporterProps) {
    this.eval_run = props.eval_run;
    this.metrics_min = props.metrics_min || {};
    this.report = RetrievalReporter.reporter(props);
    this.pass = this.report.pass;
  }

  log() {
    log_report({ eval_run: this.eval_run, report: this.report });
  }
}

export interface JSONReporterProps {
  eval_runs: components["schemas"]["TestRunItem"][];
}

export class JSONReporter {
  eval_runs: components["schemas"]["TestRunItem"][];

  constructor(props: JSONReporterProps) {
    this.eval_runs = props.eval_runs;
  }

  log() {
    if (!this.eval_runs || this.eval_runs.length === 0) {
      console.log("No evaluation runs found to report");
      return;
    }

    // Held for compatibility with older versions of the reporter
    if (
      process.env.OKAREO_JSON_OUTPUT_FILE &&
      process.env.OKAREO_JSON_OUTPUT_FILE.length > 0
    ) {
      const fs = require("fs");
      const outputFilePath = process.env.OKAREO_JSON_OUTPUT_FILE;
      try {
        fs.writeFileSync(
          outputFilePath,
          JSON.stringify(this.eval_runs, null, 2),
        );
      } catch (err) {
        console.error("Error writing to file:", err);
      }
    }

    if (
      process.env.OKAREO_REPORT_DIR &&
      process.env.OKAREO_REPORT_DIR.length > 0
    ) {
      const fs = require("fs");
      const report_dir = process.env.OKAREO_REPORT_DIR;
      try {
        for (let i = 0; i < this.eval_runs.length; i++) {
          const eval_item: components["schemas"]["TestRunItem"] =
            this.eval_runs[i];
          if (eval_item) {
            const eval_name = eval_item.name || eval_item.id;
            const eval_report_file_name =
              eval_name.replace(/ /g, "_") + ".json";
            fs.writeFileSync(
              report_dir + eval_report_file_name,
              JSON.stringify(eval_item, null, 2),
            );
          }
        }
      } catch (err) {
        console.error("Error writing to file:", err);
      }
    }

    if (
      !process.env.OKAREO_JSON_OUTPUT_FILE &&
      !process.env.OKAREO_REPORT_DIR
    ) {
      console.log(JSON.stringify(this.eval_runs, null, 2));
    }
  }
}
