module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testTimeout: 100000,
    setupFiles: ["<rootDir>/tests/setup-env.ts"],
};
