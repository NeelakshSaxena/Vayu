import pytest
from app.llm.providers.runpod import RunpodProvider

def test_extract_text_from_output_dict():
    provider = RunpodProvider()
    raw_data = {
        'output': {
            'choices': [
                {
                    'finish_reason': 'length',
                    'index': 0,
                    'logprobs': None,
                    'text': '\nOkay, the user said "HELLO, WORLD" again. Let'
                }
            ]
        }
    }
    extracted = provider._extract_text_from_output(raw_data)
    assert extracted == '\nOkay, the user said "HELLO, WORLD" again. Let'

def test_extract_text_from_output_nested():
    provider = RunpodProvider()
    raw_data = {'output': [{'choices': [{'text': 'Hello World'}]}]}
    extracted = provider._extract_text_from_output(raw_data)
    assert extracted == 'Hello World'
