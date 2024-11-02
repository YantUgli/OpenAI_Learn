'use client';
import React, { useState, useEffect } from 'react';

const ChatSidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [historyData, setHistoryData] = useState(JSON.parse(localStorage.getItem('chatHistory')) || []);
    const [message, setMessage] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [recognition, setRecognition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    console.log(message);

    // Inisialisasi pengenalan suara
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognitionInstance = new window.webkitSpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'id-ID';

            recognitionInstance.onresult = (event) => {
                console.log('Hasil pengenalan suara: ', event.results); // Debug hasil pengenalan suara
                setMessage(event.results[0][0].transcript);
            };

            recognitionInstance.onerror = (event) => {
                console.error('Error occurred in recognition: ', event.error); // Debug error pengenalan suara
                alert(`Error: ${event.error}`);
            };

            setRecognition(recognitionInstance);
        } else {
            alert('Browser tidak mendukung fitur pengenalan suara.');
        }
    }, []);

    // Mode Gelap/Terang
    useEffect(() => {
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        document.body.classList.toggle('dark-mode', isDarkMode);
    }, [isDarkMode]);

    // Fungsi Toggle Sidebar
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
        updateFooterPosition();
    };

    // Fungsi perbarui posisi footer
    const updateFooterPosition = () => {
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.style.left = isSidebarOpen ? '640px' : '50%';
            footer.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-50%)';
        }
    };

    // Fungsi mikrofon (pengenalan suara)
    const handleMicClick = () => {
        if (recognition) {
            if (!isRecording) {
                recognition.start();
            } else {
                recognition.stop();
            }
            setIsRecording(!isRecording);
        }
    };

    // Fungsi kirim pesan
    const handleSendMessage = async () => {
        if (message.trim() === '') return;

        setLoading(true);

        try {
            const res = await fetch("/api/kampak", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            // Cek apakah status respons bukan 200 OK
            if (!res.ok) {
                console.log(res);

                console.error(`Server responded with status: ${res.status}`);
                // Coba tangkap error dari response body jika ada
                const errorText = await res.text();
                throw new Error(`Server error: ${errorText}`);
            }

            // Pastikan response adalah JSON
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                setAiResponse(data.replyText || `Error: ${data.error}`);
            } else {
                throw new Error('Response is not in JSON format');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    // Fungsi hapus riwayat chat
    const clearHistory = () => {
        setHistoryData([]);
        localStorage.removeItem('chatHistory');
    };

    return (
        <div className={`chat-container  ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <button id="btn" onClick={toggleSidebar}>Toggle Sidebar</button>

                <div className="sidebar-content">
                    <button onClick={clearHistory}>Clear History</button>
                    <ul>
                        {historyData.map((question, index) => (
                            <li key={index} onClick={() => setMessage(question)}>
                                {question}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="settings">
                    <label htmlFor="theme-toggle">Dark Mode</label>
                    <input
                        type="checkbox"
                        id="theme-toggle"
                        checked={isDarkMode}
                        onChange={() => setIsDarkMode(!isDarkMode)}
                    />
                </div>
                <div className="settings">
                    <label htmlFor="theme-toggle">
                        {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'} {/* Ikon dan teks untuk menjelaskan */}
                    </label>
                    <input
                        type="checkbox"
                        id="theme-toggle"
                        checked={isDarkMode}
                        onChange={() => setIsDarkMode(!isDarkMode)}
                    />
                </div>
            </aside>

            <main className="chat-main">
                <div className="messages" id="messages">
                    {loading ? <div className="loader">Loading...</div> : <p>{aiResponse}</p>}
                </div>

                <input
                    className='text-black'
                    type="text"
                    id="user-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button id="mic-button" onClick={handleMicClick}>
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>

                <button onClick={handleSendMessage}>Send Message</button>
            </main>
        </div>
    );
};

export default ChatSidebar;
