'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface Chat {
    id: string;
    title: string;
}

interface ChatContextType {
    chats: Chat[];
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    updateChatTitle: (chatId: string, newTitle: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [chats, setChats] = useState<Chat[]>([])

    const updateChatTitle = useCallback((chatId: string, newTitle: string) => {
        setChats(prev => 
            prev.map(chat => 
                chat.id === chatId ? { ...chat, title: newTitle } : chat
            )
        )
    }, [])

    return (
        <ChatContext.Provider value={{ chats, setChats, updateChatTitle }}>
            {children}
        </ChatContext.Provider>
    )
}

export const useChats = () => {
    const context = useContext(ChatContext)
    if (context === undefined) {
        throw new Error('useChats must be used within a ChatProvider')
    }
    return context
}
