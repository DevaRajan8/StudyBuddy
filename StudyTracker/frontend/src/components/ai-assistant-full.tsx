'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Loader2, User, Bot, Edit2, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useChats } from '@/contexts/chat-context'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

interface Chat {
    id: string
    title: string
    messages: Message[]
}

export default function AIAssistantFull({ chatId }: { chatId: string }) {
    const { chats, setChats } = useChats()
    const [currentChat, setCurrentChat] = useState<Chat | null>(null)
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [editingTitle, setEditingTitle] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()

    const sendMessage = async () => {
        if (!input.trim() || !chatId || !currentChat) return

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        }

        setCurrentChat(prev => prev ? {
            ...prev,
            messages: [...prev.messages, newMessage]
        } : null)
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch(`http://localhost:5000/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMessage),
            })
            if (!response.ok) throw new Error('Failed to send message')
            const data = await response.json()

            setCurrentChat(prev => prev ? {
                ...prev,
                messages: [...prev.messages, data]
            } : null)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send message",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const startTitleEdit = () => {
        if (currentChat) {
            setNewTitle(currentChat.title)
            setEditingTitle(true)
        }
    }

    const saveTitleEdit = async () => {
        if (!currentChat || !newTitle.trim()) return

        try {
            const response = await fetch('/api/chats', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: chatId,
                    title: newTitle
                }),
            })

            if (!response.ok) throw new Error('Failed to update title')

            setCurrentChat(prev => prev ? { ...prev, title: newTitle } : null)
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat.id === chatId ? { ...chat, title: newTitle } : chat
                )
            )
            setEditingTitle(false)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update chat title",
                variant: "destructive"
            })
        }
    }

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const response = await fetch(`http://localhost:5000/chats/${chatId}`)
                if (!response.ok) throw new Error('Failed to fetch chat')
                const data = await response.json()
                setCurrentChat(data)
                setNewTitle(data.title)
            } catch (error) {
                console.error('Failed to fetch chat:', error)
                toast({
                    title: "Error",
                    description: "Failed to fetch chat",
                    variant: "destructive"
                })
            }
        }
        
        if (chatId) {
            fetchChat()
        }
    }, [chatId, toast])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [currentChat?.messages])

    if (!currentChat) {
        return (
            <Card className="w-full h-[calc(100vh-2rem)]">
                <CardContent className="flex items-center justify-center h-full">
                    <p>Loading chat...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full h-[calc(100vh-2rem)]">
            <CardHeader className="border-b">
                {editingTitle ? (
                    <div className="flex items-center space-x-2">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="h-8"
                            onKeyDown={(e) => e.key === 'Enter' && saveTitleEdit()}
                        />
                        <Button size="sm" onClick={saveTitleEdit}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <CardTitle className="flex items-center">
                        <span>{currentChat.title}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                            onClick={startTitleEdit}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                )}
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-5rem)]">
                <ScrollArea className="flex-grow pr-4 pt-4">
                    {currentChat.messages.map(message => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            } mb-4`}
                        >
                            <div
                                className={`flex items-start space-x-2 max-w-[80%] ${
                                    message.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                            >
                                <Avatar>
                                    <AvatarFallback>
                                        {message.role === 'user' ? <User/> : <Bot/>}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className={`p-3 rounded-lg ${
                                        message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                    }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef}/>
                </ScrollArea>
                <div className="flex items-center space-x-2 pt-4">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : (
                            <Send className="h-4 w-4"/>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
