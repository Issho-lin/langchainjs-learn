/*
 * @Author: linqibin
 * @Date: 2025-04-28 09:30:26
 * @LastEditors: linqibin
 * @LastEditTime: 2025-04-28 10:05:24
 * @Description:
 *
 * Copyright (c) 2025 by 智慧空间研究院/金地空间科技, All Rights Reserved.
 */
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";

const run = async () => {

  const loader = new TextLoader("../documents/data.txt");
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 20,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  console.log(process.env.EMBEDDING_MODEL_NAME);

  const embeddings = new OpenAIEmbeddings({
    model: process.env.EMBEDDING_MODEL_NAME,
    configuration: {
      baseURL: process.env.BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    },
  });
  const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

  const directory = "../db/data";
  await vectorStore.save(directory);
};

run();
