import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";




async function buildVectorStore() {
  const embeddings = new OpenAIEmbeddings({
    model: process.env.EMBEDDING_MODEL_NAME,
    batchSize: 20,
    configuration: {
      baseURL: process.env.BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    },
  });
  // 导入知识库
  const loader = new TextLoader("../documents/chatbot.txt");
  const docs = await loader.load();
  //   console.log(docs);
  // 分割文本
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 20,
  });

  const splitDocs = await splitter.splitDocuments(docs);
  //   console.log(splitDocs);

  // 构建向量库
  const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
  await vectorStore.save("../db/chatbot");
}

export async function chat(qs: string) {
  const embeddings = new OpenAIEmbeddings({
    model: process.env.EMBEDDING_MODEL_NAME,
    batchSize: 20,
    configuration: {
      baseURL: process.env.BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    },
  });
  // 加载向量库
  const vectorStore = await FaissStore.load("../db/chatbot", embeddings);

  //   构建retriever
  const retriever = vectorStore.asRetriever(2);
  //   将获取到的关联上下文document，转成纯文字
  const convertDocsToString = (documents: any[]): string => {
    return documents.map((document) => document.pageContent).join("\n");
  };
  const contextRetrieverChain = RunnableSequence.from([
    (input: any) => input.question,
    retriever,
    // (output: any) => {
    //   console.log('output------', output);
    //   return output;
    // },
    convertDocsToString,
  ]);

  // process.env.LANGCHAIN_VERBOSE = "true"
  //   查找关联上下文
  const context = await contextRetrieverChain.invoke({
    question: qs,
  });

  console.log('context------', context);

  const llm = new ChatOpenAI({
    model: process.env.MODEL_NAME,
    configuration: {
      baseURL: process.env.BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  // 构建prompt
//   const TEMPLATE = `
// 你是一个熟知内部知识库的机器人，你在回答时会引用知识库，并擅长通过自己的总结归纳，组织语言给出答案。
// 并且回答时仅根据知识库，尽可能回答用户问题，如果知识库中没有相关内容，你可以回答“原文中没有相关内容”，不要回答知识库以外的内容。

// 以下是知识库中跟用户回答相关的内容：
// {context}

// 现在，你需要基于知识库，回答以下问题：
// {question}`;

const SYSTEM_TEMPLATE = `
你是一个熟知内部知识库的机器人，你在回答时会引用知识库，并擅长通过自己的总结归纳，组织语言给出答案。
并且回答时仅根据知识库，尽可能回答用户问题，如果知识库中没有相关内容，你可以回答“原文中没有相关内容”，不要回答知识库以外的内容。

以下是知识库中跟用户回答相关的内容：
{context}

现在，你需要基于知识库，回答用户的问题。
`

  // const prompt = ChatPromptTemplate.fromTemplate(TEMPLATE);
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_TEMPLATE],
    ["human", "{question}"],
  ]);
  //   console.log(prompt);

  const outputParser = new StringOutputParser();

  // 构建chain
  const chain = RunnableSequence.from([
    {
      context: () => context,
      question: (input: any) => input.question,
    },
    prompt,
    llm,
    outputParser,
  ]);

  const rst = await chain.invoke({
    question: qs,
  });
  console.log('===========\n')
  console.log(rst);

  // for await (const chunk of await chain.stream({ question: qs })) {
  //   console.log(chunk);
  // }
}


async function main() {
  // await buildVectorStore();
  await chat("选修课有哪些？");
}

main();
