'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface Conversation {
    _id: string;
    session_id: string;
    created_at: string;
    updated_at: string;
    messages: Message[];
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
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
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
                } else {
                    loadConversationHistory(parsed.id);
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }
    }, [router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversationHistory = async (userId: number) => {
        setLoadingHistory(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost/api/bot/user/${userId}/conversations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadConversation = async (convSessionId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost/api/bot/history/${convSessionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
                setSessionId(convSessionId);
                setShowHistory(false);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

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

            if (user?.id) {
                loadConversationHistory(user.id);
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

    const getConversationPreview = (conv: Conversation) => {
        if (conv.messages && conv.messages.length > 0) {
            const firstUserMessage = conv.messages.find(m => m.role === 'user');
            return firstUserMessage?.content.substring(0, 50) + '...' || 'New conversation';
        }
        return 'New conversation';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Compact Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-robot text-white"></i>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">AyurBot</h1>
                        <p className="text-xs text-gray-500">AI Ayurvedic Assistant</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showHistory
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <i className="fas fa-history mr-2"></i>
                        History
                    </button>
                    <button
                        onClick={clearChat}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        New Chat
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* History Sidebar */}
                {showHistory && (
                    <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
                        <div className="p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Previous Conversations</h3>
                            {loadingHistory ? (
                                <div className="text-center py-8 text-gray-400">
                                    <i className="fas fa-spinner fa-spin text-2xl"></i>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No previous conversations
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {conversations.map((conv) => (
                                        <button
                                            key={conv.session_id}
                                            onClick={() => loadConversation(conv.session_id)}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${sessionId === conv.session_id
                                                ? 'bg-green-50 border-green-300'
                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <p className="text-sm text-gray-800 font-medium truncate">
                                                {getConversationPreview(conv)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(conv.updated_at).toLocaleDateString()} • {conv.messages?.length || 0} msgs
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Chat Messages - FULL WIDTH */}
                <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center max-w-3xl mx-auto">
                                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                                    <i className="fas fa-leaf text-4xl text-white"></i>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                                    Welcome to AyurBot 🌿
                                </h2>
                                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                    Your AI-powered Ayurvedic wellness companion. Ask me about doshas, herbs, diet, or lifestyle practices.
                                </p>
                                <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 w-full">
                                    <div className="flex gap-3">
                                        <i className="fas fa-info-circle text-amber-600 mt-1"></i>
                                        <div className="text-left">
                                            <p className="text-sm text-amber-900 font-semibold mb-1">Medical Disclaimer</p>
                                            <p className="text-sm text-amber-800">
                                                I provide general Ayurvedic wellness information for educational purposes. This is not medical advice.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-6xl mx-auto w-full">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-md mt-1">
                                                <i className="fas fa-leaf text-white"></i>
                                            </div>
                                        )}

                                        <div className={`flex-1 ${message.role === 'user' ? 'max-w-3xl' : ''}`}>
                                            <div className={`rounded-2xl px-6 py-4 shadow-sm ${message.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-800 border border-gray-200'
                                                }`}>
                                                <div className="text-base leading-relaxed prose prose-sm max-w-none">
                                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                            <p className={`text-xs text-gray-400 mt-2 px-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>

                                        {message.role === 'user' && (
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md mt-1">
                                                <i className="fas fa-user text-white"></i>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-md">
                                            <i className="fas fa-leaf text-white"></i>
                                        </div>
                                        <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-200">
                                            <div className="flex space-x-2">
                                                <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
                                                <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && messages.length > 0 && (
                        <div className="border-t border-gray-200 bg-white px-8 py-3">
                            <div className="max-w-6xl mx-auto">
                                <p className="text-xs text-gray-500 mb-2 font-medium">Quick questions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => sendMessage(suggestion)}
                                            disabled={loading}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-green-50 hover:text-green-700 hover:border-green-300 border border-gray-200 transition-all disabled:opacity-50"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="border-t border-gray-200 bg-white px-8 py-4">
                        <div className="max-w-6xl mx-auto flex gap-3">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about doshas, herbs, diet, or wellness practices..."
                                disabled={loading}
                                className="flex-1 px-5 py-4 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={loading || !inputMessage.trim()}
                                className="px-8 py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm hover:shadow-md"
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
