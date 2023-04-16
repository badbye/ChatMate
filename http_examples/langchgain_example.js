const { OpenAI } = require('langchain/llms/openai')
const { Calculator } = require('langchain/tools/calculator')
const { initializeAgentExecutor } =  require('langchain/agents')


const model = new OpenAI({temperature: 10, openAIApiKey: 'sk-12312', modelName: 'gpt-3.5-turbo'}, { basePath: 'http://localhost:80/v1' })
// use open directly
const res = await model.call("How old is Goole company?")
console.log(res)


// use agent executor
const tools = [
    new Calculator(),
]
const executor = await initializeAgentExecutor(
    tools,
    model,
    "zero-shot-react-description"
  );
const input =
  "Who is Olivia Wilde's boyfriend?" +
  " What is his current age raised to the 0.78 power?";
console.log(`Executing with input "${input}"...`);

const result = await executor.call({ input });

console.log(`Got output ${result.output}`);