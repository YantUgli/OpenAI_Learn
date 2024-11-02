import { marked } from 'marked';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req, res) {
    console.log(req, res, 'ini req body', req.body);

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed apasi' });
    }

    const { message } = req.body;

    try {
        // Minta model AI untuk menilai apakah gambar diperlukan
        const shouldGenerateImagePrompt = `
      Apakah input ini meminta gambar atau ilustrasi? Jawab dengan 'yes' jika iya dan 'no' jika tidak:
      Input: "${message}"
    `;

        // Minta OpenAI menilai apakah gambar diperlukan
        const shouldGenerateImageResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an assistant that can determine whether a message requests an image.' },
                { role: 'user', content: shouldGenerateImagePrompt },
            ],
            temperature: 0.3,
            max_tokens: 10,
        });

        const shouldGenerateImage = shouldGenerateImageResponse.choices[0].message.content.trim().toLowerCase() === 'yes';

        // Buat respons teks dari OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: message },
            ],
            temperature: 1,
            max_tokens: 256,
        });

        const result = completion.choices[0].message.content;
        const markedResult = marked(result);

        let image_url = null;
        // Jika model menilai gambar diperlukan, generate gambar
        if (shouldGenerateImage) {
            const responseImg = await openai.images.generate({
                prompt: message,
                n: 1,
                size: '1024x1024',
            });
            image_url = responseImg.data[0].url;
        }

        return res.status(200).json({
            replyText: markedResult,
            replyImg: image_url, // Gambar hanya diisi jika AI menilai bahwa gambar diperlukan
        });
    } catch (error) {
        console.error('Error communicating with OpenAI:', error);
        // return res.status(500).json({ error: 'Error communicating with OpenAI' });
        const errorMessage = error?.error?.message || "Unknown error occurred.";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
