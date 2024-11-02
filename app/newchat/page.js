'use client'
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [previousChats, setPreviousChats] = useState([]);
  const [currentTitle, setCurrentTitle] = useState(null);
  const [isChatClicked, setIsChatClicked] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Load previous chats from localStorage on mount
  useEffect(() => {
    const storedChats = JSON.parse(localStorage.getItem("previousChats")) || [];
    setPreviousChats(storedChats);
  }, []);

  // Function to start a new chat
  const createNewChat = () => {
    setChatHistory([]);
    setMessage("");
    setCurrentTitle(null);
    setThreadId(null);
  };

  // Function to handle clicking on a chat from sidebar
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

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsSending(true);

    // Pastikan currentTitle di-set sebelum membuat pesan
    const newTitle = currentTitle || message;
    setCurrentTitle(newTitle);

    let currentThreadId = threadId || uuidv4();
    if (!threadId) {
      setThreadId(currentThreadId);

      // Pastikan updatedPreviousChats menunggu currentTitle yang baru
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
    <div style={{ display: 'flex' }}>
      {/* Sidebar for chat list and new chat button */}
      <div style={{ width: '200px', borderRight: '1px solid #ccc', padding: '10px' }}>
        <button onClick={createNewChat}>New Chat</button>
        <h3>Previous Chats</h3>
        <ul>
          {uniqueTitles.map((title, index) => (
            <li key={index} onClick={() => handleClickChat(title)}>
              {title}
            </li>
          ))}
        </ul>
      </div>

      {/* Main chat area */}
      <div style={{ flexGrow: 1, padding: '10px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={handleSendMessage} disabled={isSending}>
          Send
        </button>

        {/* Display chat history */}
        <div>
          {chatHistory.map((chat, index) => (
            <div key={index} className={chat.role}>
              <strong>{chat.role}:</strong> {chat.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
