'use client'
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    // { role: 'assistant', content: 'How Can I Help You?' }
  ]);
  const [catchError, setCatchError] = useState()
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    // Tambahkan pesan pengguna ke chat history
    setChatHistory([...chatHistory, { role: "user", content: message }]);
    setMessage(""); // Kosongkan input setelah mengirim pesan

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      console.log(data);
      setCatchError(data?.error)

      // Tambahkan respons dari OpenAI ke chat history
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false); // Reset status pengiriman
    }


  };
  console.log(chatHistory, catchError)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  return (

    <div>
      <div className={${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}}>
      <button onClick={toggleSidebar} className={styles.toggleButton}>
        {isSidebarOpen ? '←' : '→'}
      </button>

      <div className={styles.sidebarHeader}>
        <img src="/img/ss-logo-icon.png" alt="Logo" className={styles.logo} />
        Smarteschool
      </div>
      <ul className={styles.sidebarMenu}>
        <li>
          <img src="/img/ss-logo-icon.png" alt="Icon 1" className={styles.sidebarIcon} />
          How to write an impacting ...
        </li>
        <li>
          <img src="/img/ss-logo-icon.png" alt="Icon 2" className={styles.sidebarIcon} />
          Web accessibility
        </li>
        <li>
          <img src="/img/ss-logo-icon.png" alt="Icon 3" className={styles.sidebarIcon} />
          Design inspiration
        </li>
        <li>
          <img src="/img/ss-logo-icon.png" alt="Icon 4" className={styles.sidebarIcon} />
          What is machine learning
        </li>
      </ul>
      <div>
        <button className={styles.sidebarButton}>
          <img src="/img/icon-plus.svg" alt="Chat Icon" className={styles.sidebarIcon} />
          Start a new chat
        </button>
      </div>
      <div className={styles.sidebarFooter}>
        <button>Clear all conversations</button>
        <button>Switch Light Mode</button>
        <button>Update & Faq</button>
        <button>Log out</button>
      </div>
    </div>


  );
}
