import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import type { User, ChatSession, Message, Attachment } from '../types';
import axios from 'axios';

interface Props {
    user: User;
    onLogout: () => void;
}

const API_BASE = '/api';

const ChatInterface: React.FC<Props> = ({ user, onLogout }) => {
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (currentChatId) {
            fetchChat(currentChatId);
        } else {
            setMessages([]);
        }
    }, [currentChatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const fetchChats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/chats`);
            setChats(res.data);
        } catch (err) {
            console.error("Failed to fetch chats", err);
        }
    };

    const fetchChat = async (id: string) => {
        try {
            const res = await axios.get(`${API_BASE}/chats/${id}`);
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error("Failed to fetch chat", err);
        }
    };

    const handleNewChat = async () => {
        try {
            const res = await axios.post(`${API_BASE}/chats`, { title: "New Chat" });
            setChats([res.data, ...chats]);
            setCurrentChatId(res.data.id);
            setMessages([]);
        } catch (err) {
            console.error("Failed to create chat", err);
        }
    };

    const handleSendMessage = async (content: string, file: File | null) => {
        setLoading(true);
        let attachment: Attachment | undefined = undefined;
        let imagesB64: string[] | undefined = undefined;
        let videoUrl: string | undefined = undefined;

        // Ensure we have an active chat ID
        let activeChatId = currentChatId;
        if (!activeChatId) {
            const res = await axios.post(`${API_BASE}/chats`, { title: content || "New Chat" });
            activeChatId = res.data.id;
            setChats((prev: ChatSession[]) => [res.data, ...prev]);
            setCurrentChatId(activeChatId);
        }

        // 1. Upload File (if any)
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const uploadRes = await axios.post(`${API_BASE}/upload`, formData);
                attachment = {
                    type: uploadRes.data.type,
                    filename: uploadRes.data.filename,
                    images: uploadRes.data.images, // array of base64 
                    video_url: uploadRes.data.video_url
                };
                imagesB64 = uploadRes.data.images;
                videoUrl = uploadRes.data.video_url;
            } catch (err) {
                console.error("File upload failed", err);
                setLoading(false);
                return;
            }
        }

        // Optimistically add user message to UI
        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
            attachment,
            images: imagesB64,
            video_url: videoUrl
        };
        setMessages((prev: Message[]) => [...prev, newUserMsg]);

        // 2. Send to Chat completion API
        try {
            const response = await axios.post(`${API_BASE}/chat`, {
                chat_id: activeChatId,
                message: content,
                images: imagesB64,
                video_url: videoUrl
            }, {
                timeout: 600000 // 10 minutes timeout for long-running vision tasks
            });

            const aiMsg: Message = {
                id: response.data.assistant_msg_id,
                role: 'assistant',
                content: response.data.message,
                timestamp: new Date().toISOString()
            };

            setMessages((prev: Message[]) => [...prev, aiMsg]);

            // Refresh sidebar to update titles/counts
            fetchChats();
        } catch (err: any) {
            console.error("Chat request failed", err);

            let errorMessage = "An error occurred while communicating with the model.";

            if (err.code === 'ECONNABORTED') {
                errorMessage = "Error: The request timed out. The document might be too large or the server is busy. Please try with a smaller document.";
            } else if (err.response && err.response.data && err.response.data.detail) {
                errorMessage = `Error: ${err.response.data.detail}`;
            } else if (err.message) {
                errorMessage = `Error: ${err.message}`;
            }

            setMessages((prev: Message[]) => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: errorMessage,
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Removed handleScanOCR as OCR functionality is deprecated.

    const handleDeleteChat = async (id: string) => {
        if (!confirm("Are you sure you want to delete this chat?")) return;
        try {
            await axios.delete(`${API_BASE}/chats/${id}`);
            setChats(chats.filter(c => c.id !== id));
            if (currentChatId === id) {
                setCurrentChatId(null);
                setMessages([]);
            }
        } catch (err) {
            console.error("Failed to delete chat", err);
        }
    };

    return (
        <div className={`flex h-screen bg-[var(--main-bg)] overflow-hidden theme-${theme} transition-colors duration-300`}>
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block shrink-0">
                <Sidebar
                    chats={chats}
                    currentChatId={currentChatId}
                    user={user}
                    theme={theme}
                    onSelectChat={setCurrentChatId}
                    onDeleteChat={handleDeleteChat}
                    onNewChat={handleNewChat}
                    onLogout={onLogout}
                    onToggleTheme={toggleTheme}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">

                {/* Header (Mobile) */}
                <div className="md:hidden flex items-center p-4 border-b border-[var(--sidebar-border)] bg-[var(--header-bg)]">
                    <h1 className="font-bold flex-1 text-[var(--text-main)]">VLM Chatbot</h1>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto pb-32">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 mb-6 flex items-center justify-center text-white">
                                <span className="text-2xl font-bold font-serif shadow-sm">G</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
                            <p className="text-sm max-w-sm text-center">
                                Upload documents, images, or simply type your question below to interact with the Qwen3-VL Vision Language Model.
                            </p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            {messages.map(msg => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}
                            {loading && (
                                <div className="w-full py-6 bg-[var(--bubble-ai)] transition-colors duration-300">
                                    <div className="max-w-3xl mx-auto flex gap-6 px-4">
                                        <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center shrink-0 shadow-sm">
                                            <span className="text-white text-xs font-bold">AI</span>
                                        </div>
                                        <div className="flex gap-1 items-center">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area (Pinned to bottom) */}
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--main-bg)] via-[var(--main-bg)] to-transparent pt-10 pb-4`}>
                    <ChatInput
                        onSendMessage={handleSendMessage}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
