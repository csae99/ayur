'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export default function AyurBotPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([
        "What is my dosha?",
        "I have trouble sleeping",
        "Herbs for stress relief",
        "Diet for digestion"
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                setUser(parsed);
                if (parsed.role !== 'patient') {
                    router.replace('/dashboard');
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }
    }, [router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const sendMessage = async (messageText?: string) => {
        const textToSend = messageText || inputMessage;
        if (!textToSend.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: textToSend,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost/api/bot/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: textToSend,
                    session_id: sessionId,
                    user_id: user?.id
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from AyurBot');
            }

            const data = await response.json();

            const botMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, botMessage]);
            setSessionId(data.session_id);

            if (data.suggestions && data.suggestions.length > 0) {
                setSuggestions(data.suggestions);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setSessionId(null);
        setSuggestions([
            "What is my dosha?",
            "I have trouble sleeping",
            "Herbs for stress relief",
            "Diet for digestion"
        ]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PatientNav username={user?.username} onLogout={handleLogout} />

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            <i className="fas fa-robot text-green-600 mr-3"></i>
                            AyurBot - Your Ayurvedic Wellness Assistant
                        </h1>
                        <p className="text-gray-600">
                            Get personalized Ayurvedic guidance on herbs, diet, and wellness practices
                        </p>
                    </div>
                    <button
                        onClick={clearChat}
                        className="btn btn-outline text-sm"
                    >
                        <i className="fas fa-trash mr-2"></i>
                        Clear Chat
                    </button>
                </div>

                {/* Chat Container */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                    <i className="fas fa-leaf text-5xl text-green-600"></i>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                    Welcome to AyurBot! 🌿
                                </h3>
                                <p className="text-gray-600 max-w-md mb-6">
                                    I'm here to help with Ayurvedic wellness advice, herb recommendations,
                                    and lifestyle guidance. Ask me anything about doshas, natural remedies, or holistic health!
                                </p>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg">
                                    <p className="text-sm text-yellow-800">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        <strong>Disclaimer:</strong> I provide general Ayurvedic wellness information.
                                        For serious health concerns, please consult a qualified practitioner.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${message.role === 'user'
                                                    ? 'bg-blue-600'
                                                    : 'bg-green-600'
                                                }`}>
                                                <i className={`fas ${message.role === 'user' ? 'fa-user' : 'fa-leaf'} text-white`}></i>
                                            </div>

                                            {/* Message Bubble */}
                                            <div>
                                                <div className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {message.content}
                                                    </p>
                                                </div>
                                                <p className={`text-xs text-gray-400 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                    {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="flex gap-3 max-w-[80%]">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-600">
                                                <i className="fas fa-leaf text-white"></i>
                                            </div>
                                            <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                                <div className="flex space-x-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && messages.length > 0 && (
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => sendMessage(suggestion)}
                                        disabled={loading}
                                        className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-green-50 hover:border-green-300 transition-colors disabled:opacity-50"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about doshas, herbs, diet, or wellness..."
                                disabled={loading}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={loading || !inputMessage.trim()}
                                className="btn btn-primary px-6 disabled:opacity-50"
                            >
                                {loading ? (
                                    <i className="fas fa-spinner fa-spin"></i>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane mr-2"></i>
                                        Send
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
