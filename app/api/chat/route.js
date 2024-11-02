// app/api/chat/route.js
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY


});

export async function POST(req) {
    const { message } = await req.json();

    try {
        const completion = await openai.chat.completions.create({
            // model: "gpt-3.5-turbo",
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Kamu adalah sebuah pemandu di website ini, website ini ada di bidang teknologi dan pendidikan jadi berikan respon layaknya insan akademik. jawablah menggunakan bahasa indonesia" },
                { role: "user", content: message },
                // { role: "user", content: 'nama saya bryant' },
                // { role: "user", content: 'siapa nama saya?' },

            ],
        });
        console.log(message, process.env.OPENAI_API_KEY);

        const aiMessage = completion.choices[0].message.content;
        console.log(completion);

        return new Response(JSON.stringify({ message: aiMessage }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error with OpenAI API:", error);
        const errorMessage = error?.error?.message || "Unknown error occurred.";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
