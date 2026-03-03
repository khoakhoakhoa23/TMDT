import requests
import json

url = "http://127.0.0.1:8000/api/translation/translate/"
data = {
    "text": "Hello world, this is a test",
    "target_lang": "vi",
    "provider": "openai"  # Force using OpenAI
}

response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
