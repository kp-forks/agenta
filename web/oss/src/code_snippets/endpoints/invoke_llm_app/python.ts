export default function pythonCode(uri: string, params: string, apiKey: string): string {
    return `import requests
import json

url = "${uri}"
params = ${params}
headers = {
    "Content-Type": "application/json",    
    "Authorization": "ApiKey ${apiKey}", # Add your API key here
}

response = requests.post(url, json=params, headers=headers)

data = response.json()

print(json.dumps(data, indent=4))
`
}
