import React from 'react';
import type { Message } from '../types';
import { Video } from 'lucide-react';

interface MessageBubbleProps {
    message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`w-full py-6 transition-colors duration-300 ${isUser ? '' : 'bg-[var(--bubble-ai)]'}`}>
            <div className="max-w-3xl mx-auto px-4 flex flex-col gap-2 min-w-0">

                {/* Attachment / Image Preview */}
                {message.attachment && (
                    <div className="flex gap-2 flex-wrap mb-2">
                        {message.attachment.type === 'video' ? (
                            <div className="flex items-center gap-2 bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--input-border)] max-w-sm">
                                <Video className="text-purple-400 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium truncate text-[var(--text-main)]">{message.attachment.filename}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">Video Sampled</p>
                                </div>
                            </div>
                        ) : message.attachment.images?.[0] ? (
                            <img
                                src={`data:image/png;base64,${message.attachment.images[0]}`}
                                alt="Uploaded file"
                                className="max-w-[250px] rounded-xl border border-[var(--input-border)]"
                            />
                        ) : null}
                    </div>
                )}

                {/* Text Content */}
                <div className={`prose prose-invert max-w-none break-words text-[var(--text-main)] ${isUser ? 'bg-[var(--bubble-user)] px-4 py-2 rounded-2xl' : ''}`}>
                    {message.content.split('\n').map((line, i) => (
                        <p key={i} className={i === 0 ? 'mt-0' : ''}>
                            {line}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
