// pages/api/chatnew.js
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";

// Initialize the LLM and loaders
const llm2 = new ChatOpenAI({ model: "gpt-3.5-turbo" });
const loader2 = new CheerioWebBaseLoader("https://lilianweng.github.io/posts/2023-06-23-agent/");
const docs2 = await loader2.load();

// Split documents
const textSplitter2 = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});
const splits2 = await textSplitter2.splitDocuments(docs2);
const vectorStore2 = await MemoryVectorStore.fromDocuments(
    splits2,
    new OpenAIEmbeddings()
);

// Create retriever and chains
const retriever2 = vectorStore2.asRetriever();
const contextualizeQSystemPrompt2 =
    "Given a chat history and the latest user question " +
    "which might reference context in the chat history, " +
    "formulate a standalone question which can be understood " +
    "without the chat history. Do NOT answer the question, " +
    "answer the question using Indonesia in priority" +
    "just reformulate it if needed and otherwise return it as is.";

const contextualizeQPrompt2 = ChatPromptTemplate.fromMessages([
    ["system", contextualizeQSystemPrompt2],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
]);

const historyAwareRetriever2 = await createHistoryAwareRetriever({
    llm: llm2,
    retriever: retriever2,
    rephrasePrompt: contextualizeQPrompt2,
});

const systemPrompt2 =
    "You are an assistant for question-answering tasks. Remember the user's name if they provide it. " +
    "Use the following pieces of retrieved context to answer the question. " +
    "If you don't know the answer, say that you don't know. " +
    "Use three sentences maximum and keep the answer concise." +
    "\n\n" +
    "{context}";


const qaPrompt2 = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt2],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
]);

const questionAnswerChain2 = await createStuffDocumentsChain({
    llm: llm2,
    prompt: qaPrompt2,
});

const ragChain2 = await createRetrievalChain({
    retriever: historyAwareRetriever2,
    combineDocsChain: questionAnswerChain2,
});

// API handler
export async function POST(req) {
    const { message, thread_id, chat_history } = await req.json();
    console.log("Received input:", message);
    console.log("Thread ID:", thread_id);
    console.log("Chat history received:", chat_history);

    // Jika ada history yang diterima dari frontend, gunakan itu, jika tidak ambil dari `thread_id`
    let retrievedChatHistory = chat_history?.length ? chat_history.map(msg => {
        return msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content);
    }) : []
    // : getChatHistoryByThreadId(thread_id);

    let newThreadId = thread_id || uuidv4();

    retrievedChatHistory.push(new HumanMessage(message)); // Tambahkan input pengguna

    const response = await ragChain2.invoke({
        input: message,
        chat_history: retrievedChatHistory,
    });

    retrievedChatHistory.push(new AIMessage(response.answer));
    console.log("Updated chat history:", retrievedChatHistory);

    const apiResponse = {
        thread_id: newThreadId,
        chat_history: retrievedChatHistory,
        answer: response.answer,
    };
    console.log("API response:", apiResponse);

    return new Response(JSON.stringify(apiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

// Fungsi untuk mendapatkan chat history dari database atau penyimpanan
function getChatHistoryByThreadId(thread_id) {
    // Contoh data dummy
    const dummyHistory = [
        new HumanMessage("nama saya bryant"),
        new AIMessage("Salam, Bryant. Apakah ada yang bisa saya bantu?"),
        new HumanMessage("saya bersekolah di SMKN 1 Cibinong"),
        new HumanMessage("Saya orang tertampan didunia"),
        new HumanMessage("hobi saya masak mie"),
        new HumanMessage("maknanan favorit saya adalah mie ayam"),
        new AIMessage("Baik, akan saya catat tambahan informasi"),

    ];
    return dummyHistory;
}




