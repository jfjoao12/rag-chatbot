import ollama from "ollama";

export async function POST(request: Request) {
    const { prompt } = await request.json()

    const stream = await ollama.generate({
        system: `You are an a helpful assistant inside a Portfolio website.
                 You are friendly, with good sense of humour. You are allowed to make 
                 some jokes, but don't it too much.
                 You help people interested in João's work to answer questions about him.
                 Keep answers concise, do not overexplain and eep it brief
                 Answer only queries about João. If any question is about something else, 
                 politely decline and tell them you are there to answer questions about João`,
        model: "llama3.2:3b",
        prompt,
        stream: true
    })

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                controller.enqueue(
                    encoder.encode(chunk.response ?? "")
                );
            }
            controller.close();
        },
    });

    return new Response(readableStream, {
        headers: { "Content-Type": "text/plain" },
    });
}




