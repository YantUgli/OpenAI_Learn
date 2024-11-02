'use client';
import React, { useState, useEffect } from 'react';

const SuggestionChat = () => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [debouncedInput, setDebouncedInput] = useState(input);

    useEffect(() => {
        // Set delay debounce sebelum mengupdate `debouncedInput`
        const handler = setTimeout(() => {
            setDebouncedInput(input);
        }, 500);

        // Bersihkan timeout ketika `input` berubah
        return () => clearTimeout(handler);
    }, [input]);

    useEffect(() => {
        // Fetch suggestions hanya ketika `debouncedInput` diperbarui
        if (debouncedInput && !isComplete(debouncedInput) && debouncedInput.length <= 40) {
            fetchSuggestions(debouncedInput);
        } else {
            setSuggestions([]); // Kosongkan saran jika input kosong, sudah lengkap, atau terlalu panjang
        }
    }, [debouncedInput]);

    const fetchSuggestions = async (inputValue) => {
        setLoading(true);
        try {
            const response = await fetch('/api/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputValue }),
            });
            const data = await response.json();
            setSuggestions(data.suggestions);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (event) => {
        const value = event.target.value;

        // Batasi input hingga 40 karakter
        if (value.length <= 40) {
            setInput(value);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        setSuggestions([]); // Kosongkan saran
    };

    // Fungsi untuk memeriksa apakah input sudah berupa kalimat lengkap
    const isComplete = (value) => {
        // Cek jika kalimat sudah diakhiri dengan tanda baca (misalnya '.', '!', '?')
        return /[.!?]$/.test(value);
    };

    return (
        <div className='text-black'>
            <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ketik sesuatu..."
            />
            {loading && <p>Loading suggestions...</p>}
            {suggestions.length > 0 && (
                <ul>
                    {suggestions.map((suggestion, index) => (
                        <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SuggestionChat;
