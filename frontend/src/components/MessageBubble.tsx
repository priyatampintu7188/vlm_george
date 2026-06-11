import React from 'react';
import type { Message } from '../types';
import { Bot, User as UserIcon, FileText, Video } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`w-full py-6 text-white ${isUser ? '' : 'bg-[#2a2a2a]'}`}>
            <div className={`max-w-3xl mx-auto flex gap-4 md:gap-6 px-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-gradient-to-tr from-cyan-500 to-blue-600' : 'bg-[#10a37f]'}`}>
                    {isUser ? <UserIcon size={18} color="white" /> : <Bot size={18} color="white" />}
                </div>

                {/* Content */}
                <div className={`flex flex-col gap-2 min-w-0 ${isUser ? 'items-end' : 'items-start'} flex-1`}>

                    {/* Attachment / Image Preview */}
                    {message.attachment && (
                        <div className="flex gap-2 flex-wrap mb-2">
                            {message.attachment.type === 'video' ? (
                                <div className="flex items-center gap-2 bg-[#424242] p-3 rounded-xl max-w-sm">
                                    <Video className="text-purple-400 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-medium truncate">{message.attachment.filename}</p>
                                        <p className="text-xs text-gray-400">Video Sampled</p>
                                    </div>
                                </div>
                            ) : message.attachment.images?.[0] ? (
                                <img
                                    src={`data:image/png;base64,${message.attachment.images[0]}`}
                                    alt="Uploaded file"
                                    className="max-w-[250px] rounded-xl border border-[#424242]"
                                />
                            ) : null}
                        </div>
                    )}

                    {/* OCR Comparison or Standard Text Content */}
                    <div className={`prose prose-invert max-w-none break-words ${isUser ? 'text-right bg-[#2f2f2f] px-4 py-2 rounded-2xl' : ''}`}>
                        {message.content.split('\n').map((line, i) => (
                            <span key={i}>
                                {line}
                                {i !== message.content.split('\n').length - 1 && <br />}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
