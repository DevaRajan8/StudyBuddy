'use client'

import React, {useEffect, useState} from 'react'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarTrigger,
} from '@/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {Button} from '@/components/ui/button'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible'
import {useTheme} from 'next-themes'
import {
    Home,
    Calendar,
    BookOpen,
    Settings,
    MessageSquare,
    User2,
    ChevronDown,
    LogOut,
    Sun,
    Moon,
    Plus,
    Trash2,
    MessageCircle,
    SquareCheckBig,
    Wrench,
    FileText
} from 'lucide-react'
import { useChats } from '@/contexts/chat-context'

export default function AppSidebar() {
    const {setTheme, theme} = useTheme()
    const { chats, setChats } = useChats()
    const [isAIMenuOpen, setIsAIMenuOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isUtilitiesMenuOpen, setIsUtilitiesMenuOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const isActive = (path: string) => pathname === path

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    const fetchChats = React.useCallback(async () => {
        try {
            const response = await fetch('/api/chats')
            const data = await response.json()
            setChats(data)
        } catch (error) {
            console.error('Error fetching chats:', error)
        }
    }, [setChats])

    useEffect(() => {
        fetchChats()
    })

    const createNewChat = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({title: `Chat ${chats.length + 1}`}),
            })
            const newChat = await response.json()
            setChats(prevChats => [...prevChats, newChat])
            fetchChats()
            // Remove router.push - no longer redirecting
        } catch (error) {
            console.error('Error creating new chat:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const deleteChat = async (chatId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            await fetch('/api/chats', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: chatId })
            })
            setChats(prevChats => prevChats.filter(chat => chat.id !== chatId))

            if (pathname === `/assistant/${chatId}`) {
                const remainingChats = chats.filter(chat => chat.id !== chatId)
                if (remainingChats.length > 0) {
                    router.push(`/assistant/${remainingChats[0].id}`)
                } else {
                    router.push('/assistant')
                }
            }
        } catch (error) {
            console.error('Error deleting chat:', error)
        }
    }

    const isChatActive = (chatId: string) => {
        return pathname === `/assistant/${chatId}`
    }

    return (
        <Sidebar collapsible="icon"
                 className="border-r fixed left-0 top-0 h-full transition-all duration-300 ease-in-out">
            <SidebarHeader className="p-4 pl-3">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <BookOpen className="h-6 w-6"/>
                        <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">StudyTracker</span>
                    </Link>
                    <div className="group-data-[collapsible=icon]:hidden">
                        <SidebarTrigger/>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <ScrollArea className="h-[calc(100vh-10rem)]">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <Link href="/" passHref legacyBehavior>
                                <SidebarMenuButton asChild isActive={isActive('/')} className="ml-2">
                                    <a className="flex items-center">
                                        <Home className="h-4 w-4"/>
                                        <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                                    </a>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <Collapsible open={isAIMenuOpen} onOpenChange={setIsAIMenuOpen} className="ml-2">
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <MessageSquare className="h-4 w-4"/>
                                    <span className="group-data-[collapsible=icon]:hidden">Assistant</span>
                                    <ChevronDown
                                        className="ml-auto h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden"/>
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {chats.length>0 && chats.map((chat) => ( chat.id && (
                                        <SidebarMenuSubItem key={chat.id}>
                                            <Link href={`/assistant/${chat.id}`} passHref legacyBehavior>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isChatActive(chat.id)}
                                                    className="flex justify-between items-center"
                                                >
                                                    <a>
                                                        <div className="flex items-center">
                                                            <MessageCircle className="mr-2 h-4 w-4"/>
                                                            <span>{chat.title}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => deleteChat(chat.id, e)}
                                                            className="ml-2 p-0 hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </Button>
                                                    </a>
                                                </SidebarMenuSubButton>
                                            </Link>
                                        </SidebarMenuSubItem>
                                    )))}
                                    <SidebarMenuSubItem>
                                        <Button
                                            onClick={createNewChat}
                                            disabled={isLoading}
                                            className="w-full justify-start"
                                            variant="ghost"
                                        >
                                            <Plus className="mr-2 h-4 w-4"/>
                                            New Chat
                                        </Button>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                        <Collapsible open={isUtilitiesMenuOpen} onOpenChange={setIsUtilitiesMenuOpen} className="ml-2">
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <Wrench className="h-4 w-4"/>
                                    <span className="group-data-[collapsible=icon]:hidden">Utilities</span>
                                    <ChevronDown
                                        className="ml-auto h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden"/>
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <Link href="/utilities/plagiarism-checker" passHref legacyBehavior>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isActive('/utilities/plagiarism-checker')}
                                            >
                                                <a>
                                                    <FileText className="mr-2 h-4 w-4"/>
                                                    <span>Plagiarism Checker</span>
                                                </a>
                                            </SidebarMenuSubButton>
                                        </Link>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                        <SidebarMenuItem>
                            <Link href="/calendar" passHref legacyBehavior>
                                <SidebarMenuButton asChild isActive={isActive('/calendar')} className="ml-2">
                                    <a className="flex items-center">
                                        <Calendar className="h-4 w-4"/>
                                        <span className="group-data-[collapsible=icon]:hidden">Calendar</span>
                                    </a>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Link href="/tasks" passHref legacyBehavior>
                                <SidebarMenuButton asChild isActive={isActive('/tasks')} className="ml-2">
                                    <a className="flex items-center">
                                        <SquareCheckBig className="h-4 w-4"/>
                                        <span className="group-data-[collapsible=icon]:hidden">Tasks</span>
                                    </a>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <Link href="/settings" passHref legacyBehavior>
                                <SidebarMenuButton asChild isActive={isActive('/settings')} className="ml-2">
                                    <a className="flex items-center">
                                        <Settings className="h-4 w-4"/>
                                        <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                                    </a>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={toggleTheme} className="ml-2">
                                {mounted ? (
                                    <>
                                        {theme === 'dark' ? (
                                            <Sun className="h-4 w-4"/>
                                        ) : (
                                            <Moon className="h-4 w-4"/>
                                        )}
                                        <span className="group-data-[collapsible=icon]:hidden">
                                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Sun className="h-4 w-4"/>
                                        <span className="group-data-[collapsible=icon]:hidden">Theme</span>
                                    </>
                                )}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </ScrollArea>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <div className="hidden group-data-[collapsible=icon]:block">
                        <SidebarTrigger/>
                    </div>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton>
                                        <Avatar className="h-6 w-6 flex-shrink-0">
                                            <AvatarImage src="https://github.com/mNandhu.png" alt="@username"/>
                                            <AvatarFallback>UN</AvatarFallback>
                                        </Avatar>
                                        <span className="ml-2 group-data-[collapsible=icon]:hidden">Kiruthik</span>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width]"
                            >
                                <DropdownMenuItem>
                                    <User2 className="mr-2 h-4 w-4"/>
                                    <span>Account</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4"/>
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <LogOut className="mr-2 h-4 w-4"/>
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}