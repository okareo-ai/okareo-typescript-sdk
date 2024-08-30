import type { components } from "../api/v1/okareo_endpoints";
import { TestRunType } from "../core/models";
import { ClassificationReporter, RetrievalReporter, GenerationReporter } from "./eval_reporters";

/**
 * Generic type for asserions
 */
export type Assertions = {
    [key: string]: any;
};

/**
 * Properties to gather a historical report of evaluations for a model type
 */
export interface EvaluationHistoryReporterProps {
    type: TestRunType;
    evals: components["schemas"]["TestRunItem"][];
    assertions: Assertions;
    last_n?: number;
}

/**
 * Private function to generate a general history report 
 */
export const general_history_report = (type: TestRunType, results: {report: any, run: any}[], assertions: Assertions) => {
    const assertion_keys: string[] = [];
    for (const assertType in assertions) {
        const keys: string[] = Object.keys(assertions[assertType]);
        assertion_keys.push(...keys);
    }

    const assertion_table: any[] = [
        { assertion: "min >", ...assertions.metrics_min},
        { assertion: "max <", ...assertions.metrics_max},
        { assertion: "pass_rate", ...assertions.pass_rate}
    ];

    console.log("Assertions:");
    console.table(assertion_table);

    console.log("\nResults:");
    const res_output = results.map(r => {
        const run = r.run;
        const report = r.report;
        const data_checks = run.model_metrics.weighted_average || run.model_metrics.mean_scores || run.model_metrics || null;
        if (data_checks) {
            const metrics: any = {};
            let errorRateAssert = (assertions.error_max)?assertions.error_max:null;
            if (assertions.error_max && assertions.error_max > -1) {
                metrics["errors"] = ((report.errors < errorRateAssert) ? "✅ " : "❌ ") + report.errors;
            }
            for (const check in data_checks) {
                if (assertion_keys.includes(check)) {
                    const m = data_checks[check];

                    let minKAssert = (assertions.metrics_min[check])?assertions.metrics_min[check]:null;
                    if (minKAssert) {
                        const minKeys = (report.fail_metrics.min)?Object.keys(report.fail_metrics.min):[];
                        const name = "> "+ check;
                        metrics[name] = (!(minKeys.includes(check)) ? "✅ " : "❌ ") + m.toFixed(2);
                    }

                    let maxKAssert = (assertions.metrics_max && assertions.metrics_max[check])?assertions.metrics_max[check]:null;
                    if (maxKAssert) {
                        const maxKeys = (report.fail_metrics.max)?Object.keys(report.fail_metrics.max):[];
                        const name = "< "+ check;
                        metrics[name] = (!(maxKeys.includes(check)) ? "✅ " : "❌ ") + m.toFixed(2);
                    }

                    let passKAssert = (assertions.pass_rate && assertions.pass_rate[check])?assertions.pass_rate[check]:null;
                    if (passKAssert) {
                        const passKeys = (report.fail_metrics.pass_rate)?Object.keys(report.fail_metrics.pass_rate):[];
                        const name = check;
                        metrics[name] = (!(passKeys.includes(check)) ? "✅ " : "❌ ") + m.toFixed(2);
                    }
                }
            }
            return {
                date: new Date(run.start_time).toDateString(),
                passed: report.pass ? "🟢" : "🔴",
                ...metrics,
            }
        }
    });
    console.table(res_output);
}

/**
 * Private function to generate a retrieval history report
 */
export const retrieval_history_report = (type: TestRunType, results: {report: any, run: any}[], assertions: Assertions) => {
    const assertion_keys: string[] = [];
    for (const assertType in assertions) {
        const keys: string[] = Object.keys(assertions[assertType]);
        assertion_keys.push(...keys);
    }

    console.log("Assertions:");
    const min_mets: any = {};
    for (const m in assertions.metrics_min) {
        const at_k = assertions.metrics_min[m].at_k | 0;
        min_mets[m+at_k] = assertions.metrics_min[m].value;
    }
    const max_mets: any = {};
    for (const m in assertions.metrics_max) {
        const at_k = assertions.metrics_max[m].at_k | 0;
        max_mets[m+at_k] = assertions.metrics_max[m].value;
    }
    const error_mets: any = {};
    for (const m in assertions.pass_rate) {
        const at_k = assertions.pass_rate[m].at_k | 0;
        error_mets[m+at_k] = assertions.pass_rate[m].value;
    }
    const assertion_table: any[] = [
        { assertion: "min >", ...min_mets},
        { assertion: "max <", ...max_mets},
        { assertion: "pass_rate", ...error_mets}
    ];
    console.table(assertion_table);

    console.log("\nResults:");
    const res_output = results.map(r => {
        const run = r.run;
        const report = r.report;
        const data_checks = run.model_metrics.weighted_average || run.model_metrics.mean_scores || run.model_metrics || null;
        if (data_checks) {
            const metrics: any = {};
            for (const check in data_checks) {
                if (assertion_keys.includes(check)) {
                    const m = data_checks[check];
                    
                    let minKAssert = (assertions.metrics_min[check])?assertions.metrics_min[check]:null;
                    if (minKAssert) {
                        const minKeys = (report.fail_metrics.min)?Object.keys(report.fail_metrics.min):[];
                        const name = "> "+ check + minKAssert.at_k;
                        metrics[name] = (!(minKeys.includes(check)) ? "✅ " : "❌ ") + m[minKAssert.at_k].toFixed(2);
                    }

                    let maxKAssert = (assertions.metrics_max[check])?assertions.metrics_min[check]:null;
                    if (maxKAssert) {
                        const maxKeys = (report.fail_metrics.max)?Object.keys(report.fail_metrics.max):[];
                        const name = "< "+ check + maxKAssert.at_k;
                        metrics[name] = (!(maxKeys.includes(check)) ? "✅ " : "❌ ") + m[maxKAssert.at_k].toFixed(2);
                    }

                    let passKAssert = (assertions.pass_rate && assertions.pass_rate[check])?assertions.pass_rate[check]:null;
                    if (passKAssert) {
                        const passKeys = (report.fail_metrics.pass_rate)?Object.keys(report.fail_metrics.pass_rate):[];
                        const name = check + passKAssert.at_k;
                        metrics[name] = (!(passKeys.includes(check)) ? "✅ " : "❌ ") + m[passKAssert.at_k].toFixed(2);
                    }
                }
            }
            return {
                date: new Date(run.start_time).toDateString(),
                passed: report.pass ? "🟢" : "🔴",
                ...metrics,
            }
        }
    });
    console.table(res_output);
}

export class EvaluationHistoryReporter {
    evals: components["schemas"]["TestRunItem"][];
    assertions: Assertions;
    type: TestRunType;
    last_n: number;
    reporter: Function;

    constructor(props: EvaluationHistoryReporterProps) {
        this.type = props.type;
        this.evals = props.evals;
        this.assertions = props.assertions;
        this.last_n = props.last_n || 10;

        if (this.type === TestRunType.MULTI_CLASS_CLASSIFICATION) {
            this.reporter = ClassificationReporter.reporter;
        } else if (this.type === TestRunType.INFORMATION_RETRIEVAL) {
            this.reporter = RetrievalReporter.reporter;
        } else if (this.type === TestRunType.NL_GENERATION) {
            this.reporter = GenerationReporter.reporter;
        } else {
            this.reporter = () => {
                return {
                    pass: true,
                    errors: 0,
                    fail_metrics: {}
                }
            }
        }
    }

    log() {
        let runs:components["schemas"]["TestRunItem"][] = this.evals
        .filter(r => r.type === this.type)
        .sort((a, b) => {
            let start_time_a = a.start_time || "";
            let start_time_b = b.start_time || "";
            return  (new Date(start_time_a).getTime() > new Date(start_time_b).getTime() ? -1 : 1)
        });
        
        // after being filtered, if still more than 0 runs
        if (runs.length > 0) {
            runs.reverse();
            runs.splice(0,Math.max(0,runs.length-this.last_n));
            const reports: any[] = runs.map(run => {
                if (run.model_metrics) {
                    return {
                        run,
                        report: this.reporter({
                            eval_run: run,
                            ...this.assertions
                        }),
                    };
                }
            });
            
            if (this.type === TestRunType.INFORMATION_RETRIEVAL) {
                retrieval_history_report(this.type, reports, this.assertions);
            } else {
                general_history_report(this.type, reports, this.assertions);
            }
        } else {
            console.log("No runs found matching specification.");
        }
    }
}
