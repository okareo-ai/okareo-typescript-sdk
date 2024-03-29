import re
    
def evaluate(model_output: str, scenario_input: str) -> float:
    # Remove whitespace from the model output and scenario input
    model_output_clean = re.sub(r'\s', '', model_output)
    scenario_input_clean = re.sub(r'\s', '', scenario_input)
    
    # Calculate the ratio of non-whitespace characters
    if len(scenario_input_clean) > 0:
        ratio = len(model_output_clean) / len(scenario_input_clean)
    else:
        ratio = 0.0
    
    return ratio