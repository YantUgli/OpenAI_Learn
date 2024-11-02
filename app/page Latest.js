'use client'

import LogoChat from "@/components/svg/logoChat";
import LogoFile from "@/components/svg/logoFile";
import LogoSend from "@/components/svg/logoSend";
import { useEffect, useState } from "react";


export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    // { role: 'assistant', content: 'How Can I Help You?' }
  ]);
  const [previousChats, setPreviousChats] = useState([])
  const [currentTitle, setCurrentTiltle] = useState()
  const [isChatClicked, setIsChatClicked] = useState(false);

  const createNewChat = () => {
    setChatHistory([])
    setMessage("")
    setCurrentTiltle(null)
  }
  const handleClickChat = (uniqueTitle) => {
    setCurrentTiltle(uniqueTitle);
    setIsChatClicked(true);
    // Filter previousChats berdasarkan judul dan gunakan hasilnya sebagai chatHistory
    const selectedChatHistory = previousChats.filter(
      (chat) => chat.title === uniqueTitle
    );
    setChatHistory(selectedChatHistory);
  }

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


  useEffect(() => {
    if (isChatClicked) {
      setIsChatClicked(false); // Reset flag setelah useEffect dieksekusi
      return; // Tidak lakukan apa-apa jika chat baru saja diklik
    }
    console.log("harus nya keisi jir assalamu", chatHistory, currentTitle);

    if (!currentTitle && chatHistory) {
      setCurrentTiltle(chatHistory[0]?.content)

    }
    if (currentTitle && chatHistory) {
      // setPreviousChats(prevChats => (
      //   [...prevChats,
      //   {
      //     title: currentTitle,
      //     role: 'user',
      //     content: chatHistory[0]?.content
      //   },
      //   {
      //     title: currentTitle,
      //     role: chatHistory.role,
      //     content: chatHistory.content
      //   }
      //   ]
      // ))
      const lastChat = chatHistory[chatHistory.length - 1];
      setPreviousChats(prevChats => [
        ...prevChats,
        { title: currentTitle, role: lastChat?.role, content: lastChat?.content }
      ]);
    }
  }, [chatHistory, currentTitle])

  const currentChat = previousChats?.filter(previousChats => previousChats.title === currentTitle)
  const uniqueTitles = Array.from(new Set(previousChats.map(previousChat => previousChat.title)))

  console.log(uniqueTitles);


  console.log('ini message:', message, "ini chatHistory :", chatHistory, "ini current dan previousChats", currentTitle, previousChats)
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
            <div key={index} onClick={() => handleClickChat(uniqueTitle)} className={`w-full rounded-lg  py-2 px-4 text-sm ${uniqueTitle == currentTitle ? 'bg-[#212121]' : ''}`}>
              {uniqueTitle}
            </div>)
          }
          {/* <div className="w-full rounded-lg bg-transparent py-2 px-4 text-sm">
            hai2
          </div>
          <div className="w-full rounded-lg bg-transparent py-2 px-4 text-sm">
            hai2
          </div> */}
        </div>
        <div>
          hai
        </div>
      </aside>
      <section className="flex flex-col w-full h-full bg-[#212121] relative">

        <div className="bg-transparent p-4 text-lg">
          ChatGPT
        </div>
        <div className=" flex-1 px-16 overflow-auto">
          {currentChat?.map((chat, index) => (
            chat.role === "user" ? (
              <div key={index} className={`mb-2 text-right`}>
                <div
                  className={`bg-[#2f2f2f] rounded-xl py-2 px-4 inline-block max-w-full overflow-x-auto text-sm`} >
                  {chat.content}
                </div>
              </div>

            ) : (
              <div key={index} className={`mb-2 text-left`}>
                <div
                  className={` rounded-xl py-2 px-4 flex max-w-full overflow-x-auto text-sm gap-5`} >
                  <div className="border border-white rounded-full p-[6px] h-fit">
                    <LogoChat />
                  </div>
                  <p className="flex-1 py-2">
                    {!catchError ? chat.content : catchError}
                    {/* {chat.content} */}

                  </p>
                </div>
              </div>
            )

          ))}
        </div>

        {/* chat input */}
        <div className={" w-full h-fit pb-8 px-12"}>
          <div className={`w-full rounded-full px-4 py-3 flex gap-4 items-center justify-center ${isSending ? 'bg-[#2f2f2f]/50' : 'bg-[#2f2f2f]'}`}>
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
            <div onClick={handleSendMessage} className="p-1 h-fit bg-[#676767] rounded-full flex justify-center items-center ">
              <LogoSend />
            </div>

          </div>
        </div>

      </section>
    </div>


  );
}
