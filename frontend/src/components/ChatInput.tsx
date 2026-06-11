import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, FileText, X, Scan } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (message: string, file: File | null) => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((message.trim() || file) && !disabled) {
            onSendMessage(message, file);
            setMessage('');
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="relative bg-[#2f2f2f] rounded-2xl border border-[#424242] focus-within:ring-1 focus-within:ring-gray-400 p-2 pl-4">

                {/* File Preview Area */}
                {file && (
                    <div className="mb-2 p-2 bg-[#424242] rounded-lg inline-flex items-center gap-2 max-w-[200px]">
                        {file.type.includes('image') ? (
                            <ImageIcon size={16} className="text-blue-400 shrink-0" />
                        ) : file.type.includes('video') ? (
                            <div className="w-4 h-4 bg-purple-500 rounded-sm shrink-0" />
                        ) : (
                            <FileText size={16} className="text-red-400 shrink-0" />
                        )}
                        <span className="text-xs truncate">{file.name}</span>
                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-gray-400 hover:text-white shrink-0 ml-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    {/* Attachment Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className="p-2 bg-transparent text-gray-400 hover:text-white rounded-full transition shrink-0"
                    >
                        <PlusIcon />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,video/mp4,video/x-m4v,video/*"
                    />

                    {/* Text Input */}
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        disabled={disabled}
                        className="w-full bg-transparent border-none outline-none resize-none max-h-32 min-h-[24px] overflow-y-auto text-white placeholder:text-gray-500 py-2"
                        rows={1}
                        style={{ height: "auto" }}
                        autoFocus
                    />

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={disabled || (!message.trim() && !file)}
                        className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition disabled:bg-[#424242] disabled:text-gray-500 shrink-0"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
            <div className="text-center mt-2 text-xs text-gray-500">
                AI can make mistakes. Verify important information.
            </div>
        </div>
    );
};

// Custom plus icon matching ChatGPT aesthetic
const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default ChatInput;
