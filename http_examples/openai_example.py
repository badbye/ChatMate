import openai

openai.api_key = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

response = openai.ChatCompletion.create(
    api_base="http://localhost:80/v1",
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello world!"}]
)

print(response)
