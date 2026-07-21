import ChatMessage from "./ChatMessage";

function ChatWindow({ messages }) {

    if (messages.length === 0) {

        return (

            <div className="flex flex-col justify-center items-center h-full text-center">

                <div className="text-6xl mb-5">
                    🤖
                </div>

                <h2 className="text-3xl font-bold">
                    PrepGenius AI
                </h2>

                <p className="text-slate-400 mt-3 max-w-md">

                    Upload your placement notes and ask anything.

                </p>

            </div>

        );

    }

    return (

        <div className="space-y-6">

            {messages.map((msg, index) => (

                <ChatMessage

                    key={index}

                    role={msg.role}

                    text={msg.text}

                    sources={msg.sources}

                />

            ))}

        </div>

    );

}

export default ChatWindow;