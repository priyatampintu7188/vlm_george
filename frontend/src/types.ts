export interface User {
    username: string;
    role: string;
}

export interface Attachment {
    type: 'image' | 'video';
    filename: string;
    images?: string[];         // base64 encoded frames (for images)
    video_url?: string;        // data URI for video (stored in history)
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    images?: string[]; 
    video_url?: string;
    attachment?: Attachment;
}

export interface ChatSession {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    message_count: number;
    messages?: Message[]; // May be excluded in list views
}
