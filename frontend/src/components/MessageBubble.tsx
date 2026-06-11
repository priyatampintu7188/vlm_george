import React from 'react';
import type { Message } from '../types';
import { Bot, User as UserIcon, Video } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
    message: Message;
    theme: 'light' | 'dark';
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, theme }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`w-full py-6 transition-colors duration-300 ${isUser ? '' : 'bg-[var(--bubble-ai)]'}`}>
            <div className={`max-w-3xl mx-auto px-4 flex gap-4 md:gap-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isUser ? 'bg-gradient-to-tr from-cyan-500 to-blue-600' : 'bg-[#10a37f]'}`}>
                    {isUser ? <UserIcon size={18} color="white" /> : <Bot size={18} color="white" />}
                </div>

                <div className={`flex flex-col gap-2 min-w-0 flex-1 ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Attachment / Image Preview */}
                    {(message.attachment || message.images || message.video_id) && (
                        <div className={`flex gap-2 flex-wrap mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {/* Video: show inline player using /api/videos/{video_id} */}
                            {(message.attachment?.type === 'video' || message.video_id || message.attachment?.video_id) ? (
                                <div className="w-full max-w-sm rounded-xl overflow-hidden border border-[var(--input-border)] shadow-md bg-black">
                                    <video
                                        controls
                                        className="w-full max-h-56 object-contain"
                                        src={`/api/videos/${message.video_id || message.attachment?.video_id}`}
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--input-bg)]">
                                        <Video size={14} className="text-purple-400 shrink-0" />
                                        <span className="text-xs truncate text-[var(--text-secondary)]">
                                            {message.attachment?.filename || 'Video'}
                                        </span>
                                    </div>
                                </div>
                            ) : null}

                            {/* Image: show inline preview */}
                            {message.attachment?.type === 'image' || (message.images && message.images.length > 0) ? (
                                <img
                                    src={`data:image/png;base64,${(message.attachment?.images?.[0] ?? message.images?.[0])}`}
                                    alt="Uploaded file"
                                    className="max-w-[250px] rounded-xl border border-[var(--input-border)] shadow-md"
                                />
                            ) : null}
                        </div>
                    )}

                    {/* Text Content */}
                    <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none break-words text-[var(--text-main)] ${isUser ? 'bg-[var(--bubble-user)] px-4 py-2 rounded-2xl shadow-sm' : ''}`}>
                        <ReactMarkdown>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
