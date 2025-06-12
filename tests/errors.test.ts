import { 
    Okareo, 
    TestRunType, 
    MultiTurnDriver, 
    StopConfig, 
    SessionConfig, 
    TurnConfig, 
    CustomEndpointTarget
  } from "../dist";
  import { getProjectId } from "./setup-env";
  import { uniqueName } from "./test-utils";
  
  const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
  const BASE_URL = process.env.BASE_URL || "http://localhost:8000";
  
  let project_id: string;
  
  // Base configurations for reuse
  const createBaseStartConfig = (overrides: Partial<SessionConfig> = {}): SessionConfig => ({
    url: `${BASE_URL}/v0/custom_endpoint_stub/create`,
    method: "POST",
    headers: {
      "api-key": OKAREO_API_KEY,
      "Content-Type": "application/json"
    },
    response_session_id_path: "thread_id",
    status_code: 201,
    ...overrides
  });
  
  const createBaseNextConfig = (overrides: Partial<TurnConfig> = {}): TurnConfig => ({
    url: `${BASE_URL}/v0/custom_endpoint_stub/message`,
    method: "POST",
    headers: {
      "api-key": OKAREO_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      thread_id: "{session_id}",
      message: "{latest_message}"
    }),
    response_message_path: "response.assistant_response",
    status_code: 200,
    ...overrides
  });
  
  const createBaseMultiTurnDriver = (overrides: Partial<MultiTurnDriver> = {}): MultiTurnDriver => ({
    type: "driver",
    max_turns: 2,
    repeats: 1,
    target: {
      type: "custom_endpoint",
      start_session_params: createBaseStartConfig(),
      next_message_params: createBaseNextConfig()
    } as CustomEndpointTarget,
    stop_check: {
      check_name: "model_refusal",
      stop_on: false,
    } as StopConfig,
    ...overrides
  });
  
  // Helper function to run error test
  const runErrorTest = async (
    testName: string,
    modelConfig: Partial<MultiTurnDriver> | any,
    expectedErrorSubstring: string,
    runTestOptions: any = {}
  ) => {
    const okareo = new Okareo({ api_key: OKAREO_API_KEY });
    const name = uniqueName(testName);
    
    // Create a simple scenario for testing
    const sData = await okareo.create_scenario_set({
      name,
      project_id,
      seed_data: [{
        input: "Test input",
        result: "Test result"
      }]
    });
    
    // Register the model with the test configuration
    const model = await okareo.register_model({
      name,
      project_id,
      models: modelConfig,
      update: true,
    });
    
    // Try to run the test and capture any errors
    try {
      console.log(`Attempting to run test: ${testName}...`);
      const testResult = await model.run_test({
        name: testName,
        project_id,
        scenario_id: sData.scenario_id,
        calculate_metrics: true,
        type: TestRunType.MULTI_TURN,
        checks: ["model_refusal"],
        ...runTestOptions
      });
      
      console.log("Test result (unexpected success):", JSON.stringify(testResult, null, 2));
      fail("Expected test to fail but it succeeded");
    } catch (error) {
      console.log("Error caught as expected:", error);
      
      // Properly handle the error
      const errorObj = error as Record<string, any>;
      
      // Verify we got an error
      expect(error).toBeDefined();
      
      // Check for expected error message
      if (errorObj && errorObj.detail) {
        expect(errorObj.detail).toContain(expectedErrorSubstring);
      }
    }
  };
  
  describe("MultiTurnDriver Error Tests", () => {
    beforeAll(async () => {
      project_id = await getProjectId();
    });
  
    test("should throw error for invalid status code", async () => {
      const modelConfig = createBaseMultiTurnDriver({
        target: {
          type: "custom_endpoint",
          start_session_params: createBaseStartConfig({ status_code: 2010 }), // Wrong status code
          next_message_params: createBaseNextConfig()
        } as CustomEndpointTarget
      });
  
      await runErrorTest(
        "Status Code Mismatch Test",
        modelConfig,
        "did not match expected status code"
      );
    });
  
    test("should throw error for invalid request", async () => {
      const modelConfig = createBaseMultiTurnDriver({
        target: {
          type: "custom_endpoint",
          start_session_params: createBaseStartConfig({
            headers: {
              "api-key": "test-key", // Invalid API key
              "Content-Type": "application/json"
            }
          }),
          next_message_params: createBaseNextConfig()
        } as CustomEndpointTarget
      });
  
      await runErrorTest(
        "Invalid Request Test",
        modelConfig,
        "Invalid Okareo API"
      );
    });
  
    test("should throw error for invalid target type", async () => {
      const modelConfig: any = {
        type: "driver",
        repeats: 1,
        target: {
          type: "random", // Invalid target type
          start_session_params: createBaseStartConfig(),
          next_message_params: createBaseNextConfig()
        },
        stop_check: {
          check_name: "model_refusal",
          stop_on: false,
        } as StopConfig,
      };
  
      await runErrorTest(
        "Invalid Target Type Test",
        modelConfig,
        "Invalid target type"
      );
    });
  
    test("should throw error for invalid repeats", async () => {
      const modelConfig = createBaseMultiTurnDriver({
        repeats: -100 // Invalid repeats value
      });
  
      await runErrorTest(
        "Invalid Repeats Test",
        modelConfig,
        "Invalid 'repeats' value"
      );
    });
  
    test("should throw error for invalid rest in next message", async () => {
      const modelConfig = createBaseMultiTurnDriver({
        target: {
          type: "custom_endpoint",
          start_session_params: createBaseStartConfig(),
          next_message_params: createBaseNextConfig({ method: "POSaT" as any }) // Invalid HTTP method
        } as CustomEndpointTarget
      });
  
      await runErrorTest(
        "Invalid Next Message Method Test",
        modelConfig,
        "Invalid HTTP method"
      );
    });
  
    test("should throw error for invalid rest in start message", async () => {
      const modelConfig = createBaseMultiTurnDriver({
        target: {
          type: "custom_endpoint",
          start_session_params: createBaseStartConfig({ method: "POSaT" as any }), // Invalid HTTP method
          next_message_params: createBaseNextConfig()
        } as CustomEndpointTarget
      });
  
      await runErrorTest(
        "Invalid Start Message Method Test",
        modelConfig,
        "Invalid HTTP method"
      );
    });
  
    test("should throw error for invalid URL in start message", async () => {
      const modelConfig: any = {
        type: "driver",
        max_turns: 2,
        repeats: 1,
        target: {
          type: "custom_endpoint",
          start_session_params: {
            method: "POST",
            headers: {
              "api-key": OKAREO_API_KEY,
              "Content-Type": "application/json"
            },
            response_session_id_path: "thread_id",
            status_code: 201
            // Missing URL
          },
          next_message_params: createBaseNextConfig()
        },
        stop_check: {
          check_name: "model_refusal",
          stop_on: false,
        } as StopConfig,
      };
  
      await runErrorTest(
        "Missing Start URL Test",
        modelConfig,
        "Missing 'start_session_url'"
      );
    });
  
    test("should throw error for missing target api key", async () => {
      const modelConfig: any = {
        type: "driver",
        driver_temperature: 0,
        repeats: 1,
        stop_check: {
          check_name: "model_refusal",
          stop_on: false,
        } as StopConfig,
        target: {
          type: "generation",
          model_id: "gpt-4o-mini",
          temperature: 0,
          system_prompt_template: "Ignore what the user is saying and say: I can't help you with that",
        },
      };
  
      await runErrorTest(
        "Missing API Key Test",
        modelConfig,
        "Missing API key for target type"
      );
    });
  
    test("should throw error for missing system prompt", async () => {
      const modelConfig: any = {
        type: "driver",
        driver_temperature: 0,
        repeats: 1,
        stop_check: {
          check_name: "model_refusal",
          stop_on: false,
        } as StopConfig,
        target: {
          type: "generation",
          model_id: "gpt-4o-mini",
          temperature: 0,
          // Missing system_prompt_template
        },
      };
  
      await runErrorTest(
        "Missing System Prompt Test",
        modelConfig,
        "Missing 'system_prompt_template' for",
        { model_api_key: "test" }
      );
    });
  
    test("should throw error for missing start session", async () => {
      const modelConfig: any = {
        type: "driver",
        max_turns: 2,
        repeats: 1,
        target: {
          type: "custom_endpoint",
          // Missing start_session_params
        },
        stop_check: {
          check_name: "model_refusal",
          stop_on: false,
        } as StopConfig,
      };
  
      await runErrorTest(
        "Missing Start Session Test",
        modelConfig,
        "Missing 'start_session_params'"
      );
    });
  
    test("should throw error for invalid start session headers", async () => {
      const modelConfig: any = {
        type: "driver",
        max_turns: 2,
        repeats: 1,
        target: {
          type: "custom_endpoint",
          start_session_params: {
            url: `${BASE_URL}/v0/custom_endpoint_stub/message`,
            method: "POST",
            headers: "asdf", // Invalid headers (should be object)
            response_session_id_path: "thread_id",
            status_code: 201
          },
          next_message_params: createBaseNextConfig()
        },
        stop_check: {
          check_name: "model_refusal",
          stop_on: false,
        } as StopConfig,
      };
  
      await runErrorTest(
        "Invalid Start Headers Test",
        modelConfig,
        "Invalid JSON in start_session_params headers"
      );
    });
  
    test("should throw error for invalid headers in next message", async () => {
      const modelConfig: any = {
        type: "driver",
        max_turns: 2,
        repeats: 1,
        target: {
          type: "custom_endpoint",
          start_session_params: createBaseStartConfig(),
          next_message_params: {
            url: `${BASE_URL}/v0/custom_endpoint_stub/message`,
            method: "POST",
            headers: "asdf", // Invalid headers (should be object)
            body: JSON.stringify({
              thread_id: "{session_id}",
              message: "{latest_message}"
            }),
            response_message_path: "response.assistant_response",
            status_code: 200
          }
        },
        stop_check: {
          check_name: "model_refusal",
          stop_on: false,
        } as StopConfig,
      };
  
      await runErrorTest(
        "Invalid Next Headers Test",
        modelConfig,
        "Invalid JSON in next_message_params headers"
      );
    });
  });