import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings.js";
import dotenv from "dotenv";

export const vectorStore = async (docs, collectionName)=>{
  return await QdrantVectorStore.fromExistingCollection(docs, embeddings, {
        url: process.env. QDRANT_URL,
        collectionName
    });
}
