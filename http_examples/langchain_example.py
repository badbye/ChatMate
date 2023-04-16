import os
from langchain.llms import OpenAI

os.environ['OPENAI_API_KEY'] = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
llm = OpenAI(temperature=0.9, api_base="http://localhost:80/v1", model_name="gpt-3.5-turbo")
text = "What would be a good company name for a company that makes software?"
print(llm(text))
