import OpenAI from "openai";
import { ChatMessageHistory } from "langchain/memory";
import { StateGraph, MessagesAnnotation, MemorySaver, START, END } from "@langchain/langgraph";

// Inisialisasi OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Inisialisasi riwayat chat dan memori
const chatHistory = new ChatMessageHistory();
const memory = new MemorySaver();

// Fungsi untuk memanggil model
const callModel = async (messages) => {
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
    });
    return response.choices[0].message.content;
};

// Definisikan graf baru
const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", async (state) => {
        const response = await callModel(state.messages);
        return { messages: response };
    })
    .addEdge(START, "model")
    .addEdge("model", END);

// Kompilasi aplikasi
const app = workflow.compile({ checkpointer: memory });

// Fungsi untuk memproses input pengguna
const processUserMessage = async (userMessage, threadId = null) => {
    // Tambahkan pesan pengguna ke riwayat
    chatHistory.addUserMessage(userMessage);

    // Ambil semua pesan dari riwayat dan format dengan role
    const messages = chatHistory?.getMessages()?.map(msg => ({
        role: msg.role, // pastikan role ada
        content: msg.content
    }));

    // Jalankan aplikasi dengan input baru
    const output = await app.invoke({ messages }, { configurable: { thread_id: threadId } });

    // Tambahkan respon AI ke riwayat
    chatHistory.addAIMessage(output.messages);

    // Kembalikan pesan terakhir dari output
    return output.messages[output.messages.length - 1];
};

// Fungsi untuk menangani permintaan dari klien
const handleRequest = async (request) => {
    const { message, thread_id } = await request.json();

    // Panggil fungsi untuk memproses pesan pengguna
    const aiResponse = await processUserMessage(message, thread_id);

    return new Response(JSON.stringify({ message: aiResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

// Contoh penggunaan (di luar server HTTP)
(async () => {
    // Pesan pertama
    const response1 = await processUserMessage("Hai, saya Bryant!");
    console.log(response1); // Output dari AI

    // Pertanyaan lanjutan
    const response2 = await processUserMessage("Siapa nama saya?");
    console.log(response2); // Output dari AI
})();
