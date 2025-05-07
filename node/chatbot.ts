import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import {
  RunnablePassthrough,
  RunnableSequence,
  RunnableWithMessageHistory,
} from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { JSONChatHistory } from "./history/index";

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
  const rephraseModel = new ChatOpenAI({
    model: process.env.MODEL_NAME,
    temperature: 0.2,
    configuration: {
      baseURL: process.env.BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    },
  });
  // 矫正提问
  const rephrasePrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `给定以下对话和一个后续问题，请将后续问题重述为一个独立的问题。请注意，重述的问题应该包含足够的信息，使得没有看过对话历史的人也能理解。
      `,
    ],
    new MessagesPlaceholder("history"),
    ["human", "将这个问题重述为一个独立的问题：{question}"],
  ]);

  const rephraseChain = rephrasePrompt
    .pipe(rephraseModel)
    .pipe(new StringOutputParser());

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
    convertDocsToString,
  ]);

  // process.env.LANGCHAIN_VERBOSE = "true"
  //   查找关联上下文
  // const context = await contextRetrieverChain.invoke({
  //   question: qs,
  // });

  // console.log("context------", context);

  // 构建prompt
  const SYSTEM_TEMPLATE = `
你是一个熟知内部知识库的机器人，你在回答时会引用知识库，并擅长通过自己的总结归纳，组织语言给出答案。
并且回答时仅根据知识库，尽可能回答用户问题，如果知识库中没有相关内容，你可以从历史记录中找答案，如果历史记录也没有相关内容，你可以回答“原文中没有相关内容”，不要回答知识库以外的内容。
 以下是原文中跟用户回答相关的内容：
    {context}
  以下是历史记录
    {history}
`;

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_TEMPLATE],
    new MessagesPlaceholder("history"),
    ["human", "{question}"],
  ]);
  //   console.log(prompt);
  // 构建llm
  const llm = new ChatOpenAI({
    model: process.env.MODEL_NAME,
    configuration: {
      baseURL: process.env.BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  // 构建chain
  const chain = RunnableSequence.from([
    // {
    //   context: contextRetrieverChain,
    //   question: (input: any) => input.question,
    // },
    RunnablePassthrough.assign({
      question: rephraseChain,
    }),
    RunnablePassthrough.assign({
      context: contextRetrieverChain,
    }),
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: (sessionId) => new JSONChatHistory({ sessionId }),
    inputMessagesKey: "question",
    historyMessagesKey: "history",
  });

  // const rst = await chain.invoke({
  //   question: qs,
  // });
  // console.log("===========\n");
  // console.log(rst);

  // for await (const chunk of await chainWithHistory.stream(
  //   { question: qs },
  //   {
  //     configurable: { sessionId: "test-history" },
  //   }
  // )) {
  //   console.log(chunk);
  // }
  return await chainWithHistory.stream(
    { question: qs },
    { configurable: { sessionId: "chat-history" } }
  );
}

// async function main() {
//   // await buildVectorStore();
//   await chat("选修课有哪些？");
// }

// main();
