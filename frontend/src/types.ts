export interface User {
    username: string;
    role: string;
}

export interface Attachment {
    type: 'image' | 'video';
    filename: string;
    images?: string[];         // base64 encoded frames (for images)
    video_url?: string;        // base64 frames for VLM (not for browser playback)
    video_id?: string;         // UUID of persisted video file for browser playback
    video_ext?: string;        // file extension e.g. ".mp4"
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    images?: string[];
    video_url?: string;        // base64 frames (VLM use only)
    video_id?: string;         // UUID for serving original video via /api/videos/
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
