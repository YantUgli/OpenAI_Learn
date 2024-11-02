'use client'

import LogoChat from "@/components/svg/logoChat";
import LogoFile from "@/components/svg/logoFile";
import LogoSend from "@/components/svg/logoSend";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [previousChats, setPreviousChats] = useState([]);
  const [currentTitle, setCurrentTitle] = useState(null);
  const [isChatClicked, setIsChatClicked] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  // Load previous chats from localStorage on mount
  useEffect(() => {
    const storedChats = JSON.parse(localStorage.getItem("previousChats")) || [];
    setPreviousChats(storedChats);
  }, []);

  // Start a new chat
  const createNewChat = () => {
    setChatHistory([]);
    setMessage("");
    setCurrentTitle(null);
    setThreadId(null);
  };

  // Handle clicking on a chat from the sidebar
  const handleClickChat = (uniqueTitle) => {
    setCurrentTitle(uniqueTitle);
    setIsChatClicked(true);
    const selectedChatHistory = previousChats.filter(chat => chat.title === uniqueTitle);
    setChatHistory(selectedChatHistory);
    setThreadId(selectedChatHistory[0]?.thread_id);
  };

  useEffect(() => {
    if (isChatClicked) {
      setIsChatClicked(false);
      return;
    }

    if (chatHistory.length > 0) {
      setCurrentTitle(currentTitle || chatHistory[0]?.content);
    }
  }, [chatHistory, currentTitle]);

  const getThreeWordTitle = (text) => {
    return text.split(" ").slice(0, 3).join(" ");
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsSending(true);

    const newTitle = currentTitle || getThreeWordTitle(message);
    setCurrentTitle(newTitle);

    let currentThreadId = threadId || uuidv4();
    if (!threadId) {
      setThreadId(currentThreadId);

      const updatedPreviousChats = [
        ...previousChats,
        { title: newTitle, thread_id: currentThreadId },
      ];
      localStorage.setItem("previousChats", JSON.stringify(updatedPreviousChats));
    }

    const userMessage = { role: "user", content: message, thread_id: currentThreadId };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage(""); // Clear input

    try {
      const response = await fetch("/api/chatnew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          thread_id: currentThreadId,
          chat_history: chatHistory
        }),
      });

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.answer || "No response from the assistant.",
        thread_id: currentThreadId,
      };
      setChatHistory(prev => [...prev, assistantMessage]);

      const updatedPreviousChats = [
        ...previousChats,
        { title: newTitle, role: userMessage.role, content: userMessage.content, thread_id: currentThreadId },
        { title: newTitle, role: assistantMessage.role, content: assistantMessage.content, thread_id: currentThreadId },
      ];
      setPreviousChats(updatedPreviousChats);
      localStorage.setItem("previousChats", JSON.stringify(updatedPreviousChats));
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const uniqueTitles = Array.from(new Set(previousChats.map(chat => chat.title)));
  console.log(message);

  return (
    <div className="flex absolute top-0 left-0 right-0 bottom-0 font-[family-name:var(--font-geist-mono)]">
      <aside className="w-72 border-none bg-[#171717] p-3 flex flex-col">
        {/* New Chat */}
        <div onClick={createNewChat} className="py-2 px-4 border border-white rounded-md hover:bg-white/10 transition-all ease-out duration-300">
          + New Chat
        </div>

        {/* Choose Chat */}
        <div className="flex-1 my-8 flex flex-col gap-2 overflow-auto">
          {uniqueTitles?.map((uniqueTitle, index) =>
            <div key={index} onClick={() => handleClickChat(uniqueTitle)} className={`w-full rounded-lg py-2 px-4 text-sm ${uniqueTitle === currentTitle ? 'bg-[#212121]' : ''}`}>
              {uniqueTitle}
            </div>
          )}
        </div>
        <div>
          hai
        </div>
      </aside>

      <section className="flex flex-col w-full h-full bg-[#212121] relative">
        <div className="bg-transparent p-4 text-lg">
          ChatGPT
        </div>

        <div className="flex-1 px-16 overflow-auto">
          {chatHistory.map((chat, index) => (
            chat.role === "user" ? (
              <div key={index} className="mb-2 text-right">
                <div className="bg-[#2f2f2f] rounded-xl py-2 px-4 inline-block max-w-full overflow-x-auto text-sm">
                  {chat.content}
                </div>
              </div>
            ) : (
              <div key={index} className="mb-2 text-left">
                <div className="rounded-xl py-2 px-4 flex max-w-full overflow-x-auto text-sm gap-5">
                  <div className="border border-white rounded-full p-[6px] h-fit">
                    <LogoChat />
                  </div>
                  <p className="flex-1 py-2">
                    {chat.content}
                  </p>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Chat input */}
        <div className="w-full h-fit pb-8 px-12">
          <div className={`w-full rounded-full px-4 py-3 flex gap-4 items-center justify-center ${isSending ? 'bg-[#2f2f2f]/50' : 'bg-[#2f2f2f]'}`}>
            {/* File icon */}
            <div>
              <LogoFile />
            </div>
            <div className="flex-1 flex items-center">
              <input className="w-full bg-transparent outline-none" placeholder="Message EduSync AI"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isSending}
              />
            </div>
            <div onClick={handleSendMessage} className="p-1 h-fit bg-[#676767] rounded-full flex justify-center items-center">
              <LogoSend />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
