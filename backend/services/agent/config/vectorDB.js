import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings.js";

export const vectorStore = async (documents, collectionName) => {
  const url = process.env.QDRANT_URL;
  if (!url) throw new Error("QDRANT_URL is not configured");

  // fromDocuments creates/initializes the collection and inserts the chunks.
  // Each uploaded PDF receives its own collection to prevent cross-user retrieval.
  return QdrantVectorStore.fromDocuments(documents, embeddings, {
    url,
    collectionName,
  });
};

export const deleteVectorCollection = async (store, collectionName) => {
  if (!store?.client || !collectionName) return;
  try {
    await store.client.deleteCollection(collectionName);
  } catch (error) {
    console.warn("Unable to clean up temporary Qdrant collection:", error.message);
  }
};
