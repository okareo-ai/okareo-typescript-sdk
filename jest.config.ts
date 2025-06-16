import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    testTimeout: 100000,
    extensionsToTreatAsEsm: [".ts", ".tsx"],
    transform: {
        "^.+\\.ts$": ["ts-jest", { useESM: true }],
    },
    transformIgnorePatterns: ["/node_modules/(?!node-fetch)/"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    setupFiles: ["<rootDir>/tests/utils/setup-env.ts"],
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 55,
            functions: 80,
            lines: 70,
        },
    },
};

export default config;
