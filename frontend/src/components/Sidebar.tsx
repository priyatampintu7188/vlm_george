import React from 'react';
import { MessageSquare, Plus, LogOut, Sun, Moon, Trash2 } from 'lucide-react';
import type { ChatSession, User } from '../types';

interface SidebarProps {
    chats: ChatSession[];
    currentChatId: string | null;
    user: User;
    theme: 'light' | 'dark';
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onNewChat: () => void;
    onLogout: () => void;
    onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    chats,
    currentChatId,
    user,
    theme,
    onSelectChat,
    onDeleteChat,
    onNewChat,
    onLogout,
    onToggleTheme
}) => {
    return (
        <div className="w-64 bg-[var(--sidebar-bg)] h-full flex flex-col text-sm text-[var(--text-secondary)] border-r border-[var(--sidebar-border)] transition-colors duration-300">
            {/* Logo area */}
            <div className="p-4 border-b border-[var(--sidebar-border)] flex items-center justify-center bg-[var(--header-bg)]">
                <img src="/logo.png" alt="Company Logo" className="h-10 w-auto object-contain" />
            </div>

            {/* Top actions */}
            <div className="p-3 gap-2 flex">
                <button
                    onClick={onNewChat}
                    className="flex-1 flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bubble-user)] transition bg-[var(--main-bg)] border border-[var(--sidebar-border)]"
                >
                    <div className="flex items-center gap-2">
                        <div className="bg-[var(--text-main)] text-[var(--main-bg)] p-1 rounded">
                            <Plus size={16} />
                        </div>
                        <span className="font-medium text-[var(--text-main)]">New chat</span>
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
                        <div key={chat.id} className="group relative flex items-center">
                            <button
                                onClick={() => onSelectChat(chat.id)}
                                className={`flex-1 text-left p-2 rounded-lg truncate flex items-center gap-2 transition-colors ${currentChatId === chat.id
                                    ? 'bg-[var(--bubble-user)] text-[var(--text-main)] font-medium'
                                    : 'hover:bg-[var(--sidebar-bg)] hover:brightness-110'
                                    }`}
                            >
                                <MessageSquare size={16} className="shrink-0" />
                                <span className="truncate pr-8">{chat.title}</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(chat.id);
                                }}
                                className="absolute right-2 p-1.5 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                title="Delete Chat"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Actions (Theme Toggle & Profile) */}
            <div className="p-3 border-t border-[var(--sidebar-border)] space-y-1">
                <button
                    onClick={onToggleTheme}
                    className="w-full p-2 rounded-lg hover:bg-[var(--sidebar-bg)] hover:brightness-110 flex items-center gap-2 transition text-[var(--text-main)]"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <button
                    onClick={onLogout}
                    className="w-full p-2 rounded-lg hover:bg-[var(--sidebar-bg)] hover:brightness-110 flex items-center justify-between transition text-[var(--text-main)]"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate max-w-[120px]">{user.username}</span>
                    </div>
                    <LogOut size={16} className="text-[var(--text-secondary)]" />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
