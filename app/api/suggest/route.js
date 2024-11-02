// app/api/suggestions/route.js
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
    try {
        const { inputValue } = await req.json();

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            max_tokens: 50,
            // temperature: 0.4,
            n: 1,
            messages: [
                { role: "system", content: "You are a suggestion assistant dont answer directly the input but you give suggestion. use indonesia lenguage is priority and i give you 50 max token to answer." },
                {
                    role: "user",
                    content: `Please provide exactly three suggestions for: "${inputValue}". List suggestions directly, without numbers or bullet points, separated by line breaks. format the answare must be: "${inputValue} {your answer}" dont forget to use punctuation`
                },
            ],
        });

        const suggestionsList = response.choices[0].message.content.split('\n');
        console.log(response);

        return NextResponse.json({ suggestions: suggestionsList });
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
    }
}
