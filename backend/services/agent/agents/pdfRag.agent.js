import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getModel } from "../config/llmModel.js";
import { deleteVectorCollection, vectorStore } from "../config/vectorDB.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";

export const pdfRag = async (state) => {
  const filePath = state.file?.path;
  const collectionName = `akshar-pdf-${randomUUID().replace(/-/g, "")}`;
  let parser;
  let store;

  try {
    if (!filePath) throw new Error("PDF upload is missing");

    const buffer = await fs.readFile(filePath);
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = String(result?.text ?? "").trim();
    if (!text) {
      return { ...state, aiResponse: "I couldn't extract readable text from this PDF. If it is a scanned document, please upload an OCR-readable version." };
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 180,
    });
    const documents = await splitter.createDocuments([text]);
    if (!documents.length) throw new Error("No readable PDF text chunks were created");

    store = await vectorStore(documents, collectionName);
    const relevantDocs = await store.similaritySearch(state.prompt, 5);
    const context = relevantDocs.map((document) => document.pageContent).join("\n\n");

    const llm = await getModel("pdf-rag");
    const messages = [
      new SystemMessage(`You are Akshar AI's PDF reading assistant.
Answer the user's question using only the supplied excerpts from their uploaded PDF.
Do not invent facts. If the excerpts do not contain the answer, say: "I couldn't find this information in the uploaded PDF."
Use clear Markdown and cite page numbers only if they are present in the excerpts.`),
      new HumanMessage(`PDF excerpts:
<document_context>
${context}
</document_context>

Question:
${state.prompt}`),
    ];

    const response = await llm.invoke(messages);
    const answer = typeof response?.content === "string"
      ? response.content
      : Array.isArray(response?.content)
        ? response.content.map((part) => typeof part === "string" ? part : part?.text ?? "").join("")
        : "";

    if (!answer.trim()) throw new Error("PDF model returned an empty answer");
    await deductCredits(state.userId, "pdf");
    return { ...state, aiResponse: answer.trim() };
  } catch (error) {
    console.error("PDF RAG error:", error);
    return { ...state, aiResponse: "I couldn't analyze this PDF right now. Please try again, or upload a text-based PDF if it is scanned." };
  } finally {
    try {
      await parser?.destroy?.();
    } catch (error) {
      console.warn("PDF parser cleanup failed:", error.message);
    }
    await deleteVectorCollection(store, collectionName);
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== "ENOENT") console.warn("PDF upload cleanup failed:", error.message);
      }
    }
  }
};
