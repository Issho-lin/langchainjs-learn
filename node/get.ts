import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import "faiss-node";
import "dotenv/config";

async function run() {
  const directory = "../db/data";
  const embeddings = new OpenAIEmbeddings({
    model: process.env.EMBEDDING_MODEL_NAME,
    configuration: {
      baseURL: process.env.BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    },
  });
  const vectorstore = await FaissStore.load(directory, embeddings);

  //   const retriever = vectorstore.asRetriever(2);

  const llm = new ChatOpenAI({
    model: process.env.MODEL_NAME,
    configuration: {
      baseURL: process.env.BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    },
  });

  // 使用 LLM 去将用户的输入改写成多个不同写法，从不同的角度来表达同一个意思，来克服因为关键词或者细微措词导致检索效果差的问题
  //   const retriever = MultiQueryRetriever.fromLLM({
  //     llm,
  //     retriever: vectorstore.asRetriever(2),
  //     queryCount: 2,
  //     verbose: false,
  //   });

  //   process.env.LANGCHAIN_VERBOSE = "true";
  //   创建一个从 Document 中提取核心内容的 compressor
    const compressor = LLMChainExtractor.fromLLM(llm);
    // 创建一个会自动对上下文进行压缩的 Retriever
    const retriever = new ContextualCompressionRetriever({
      baseCompressor: compressor,
      baseRetriever: vectorstore.asRetriever(2),
    });

//   const retriever = ScoreThresholdRetriever.fromVectorStore(vectorstore, {
//     minSimilarityScore: 0.8,
//     maxK: 2,
//     kIncrement: 1,
//   });

  const res = await retriever.invoke("虚拟导购的技术实现");

  console.log(res);
}

run();
