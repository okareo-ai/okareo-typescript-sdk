from abc import ABC, abstractmethod
import re
import nltk
import spacy
import sklearn

class BaseCheck(ABC):
    @staticmethod
    @abstractmethod
    def evaluate():
        pass

class Check(BaseCheck):
    @staticmethod
    def evaluate(model_output: str, scenario_result: str) -> bool:
        # Calculate the length of the model output and expected result
        model_output_length = len(model_output)
        expected_result_length = len(scenario_result)
        
        # Calculate the maximum allowed length for the model output
        max_allowed_length = expected_result_length * 1.1
        
        # Check if the model output length exceeds the maximum allowed length
        if model_output_length > max_allowed_length:
            return False
        
        return True