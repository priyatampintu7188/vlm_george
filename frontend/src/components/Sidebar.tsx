import React from 'react';
import { MessageSquare, Plus, LogOut } from 'lucide-react';
import type { ChatSession, User } from '../types';

interface SidebarProps {
    chats: ChatSession[];
    currentChatId: string | null;
    user: User;
    onSelectChat: (id: string) => void;
    onNewChat: () => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    chats,
    currentChatId,
    user,
    onSelectChat,
    onNewChat,
    onLogout
}) => {
    return (
        <div className="w-64 bg-[#171717] h-full flex flex-col text-sm text-gray-300 border-r border-[#303030]">
            {/* Logo area */}
            <div className="p-4 border-b border-[#303030] flex items-center justify-center bg-[#212121]">
                <img src="/logo.png" alt="Company Logo" className="h-10 w-auto object-contain" />
            </div>

            {/* Top actions */}
            <div className="p-3 gap-2 flex">
                <button
                    onClick={onNewChat}
                    className="flex-1 flex items-center justify-between p-2 rounded-lg hover:bg-[#2f2f2f] transition bg-[#212121] border border-[#303030]"
                >
                    <div className="flex items-center gap-2">
                        <div className="bg-white text-black p-1 rounded">
                            <Plus size={16} />
                        </div>
                        <span className="font-medium text-white">New chat</span>
                    </div>
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1 mt-4">
                <div className="text-xs font-semibold text-gray-500 mb-3 px-2">Recent</div>
                {chats.length === 0 ? (
                    <div className="text-gray-500 px-2 italic text-xs">No recent chats</div>
                ) : (
                    chats.map(chat => (
                        <button
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            className={`w-full text-left p-2 rounded-lg truncate flex items-center gap-2 ${currentChatId === chat.id
                                ? 'bg-[#2f2f2f] text-white'
                                : 'hover:bg-[#212121]'
                                }`}
                        >
                            <MessageSquare size={16} className="shrink-0" />
                            <span className="truncate">{chat.title}</span>
                        </button>
                    ))
                )}
            </div>

            {/* User Profile */}
            <div className="p-3 border-t border-[#303030]">
                <button
                    onClick={onLogout}
                    className="w-full p-2 rounded-lg hover:bg-[#212121] flex items-center justify-between transition"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate max-w-[120px]">{user.username}</span>
                    </div>
                    <LogOut size={16} className="text-gray-400" />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
