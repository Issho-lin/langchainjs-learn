/*
 * @Author: linqibin
 * @Date: 2025-06-29 08:54:39
 * @LastEditors: linqibin
 * @LastEditTime: 2025-07-08 10:37:47
 * @Description:
 *
 * Copyright (c) 2025 by linqibin@https://github.com/Issho-lin, All Rights Reserved.
 */
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PoolConfig } from "pg";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MultiQueryRetriever } from 'langchain/retrievers/multi_query'
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract'
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression'
import { DynamicTool } from 'langchain/tools'

const embeddings = new OpenAIEmbeddings({
  model: process.env.EMBEDDING_MODEL_NAME,
  configuration: {
    baseURL: process.env.BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// const tool = new DynamicTool({
//   name: 'Google Search',
//   description: 'A tool that returns the length of a given string',
//   func: async (input: string) => {
//     console.log(input);
//     return '5 Chinese Yuan'
//   },
//   returnDirect: true,
// });

const config = {
  postgresConnectionOptions: {
    type: "postgres",
    host: "116.198.244.42",
    port: 5432,
    user: "username",
    password: "password",
    database: "postgres",
  } as PoolConfig,
  tableName: "langchain_test_js",
};

async function run() {
  // 加载知识库
  const loader = new TextLoader("../documents/data.txt");
  const docs = await loader.load();
  // 切分（超出LLM上下文限制）
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 20,
  });

  const documents = await splitter.splitDocuments(docs);

  const vectorStore = await PGVectorStore.initialize(embeddings, config);

  await vectorStore.addDocuments(documents);

  vectorStore.similaritySearch("你好", 1);

  vectorStore.asRetriever(1)

//   const compressor = LLMChainExtractor.fromLLM()
//   const retriever = new ContextualCompressionRetriever({
//     baseCompressor: compressor,
//     baseRetriever: vectorStore.asRetriever(1),
//   })
}

run();