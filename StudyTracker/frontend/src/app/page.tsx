'use client'

import { useEffect, useState } from 'react'
import AIAssistantDashboard from '@/components/ai-assistant-dashboard'
import CalendarWidget from '@/components/calendar-widget'
import TasksDashboard from "@/components/tasks-dashboard"
import ScheduleWidget from '@/components/schedule-widget'
import { useChats } from '@/contexts/chat-context'

export default function Home() {
    const { chats } = useChats()
    const [latestChatId, setLatestChatId] = useState<string | undefined>()

    useEffect(() => {
        if (chats.length > 0) {
            setLatestChatId(chats[chats.length - 1].id)
        }
    }, [chats])

    return (
        <div className="container mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            {/* First Row */}
            <div className="flex gap-6 w-full h-[700px]">  {/* Increased height from 500px to 700px */}
                <div className="flex-[2] min-w-0 h-full">
                    <div className="h-full">
                        <TasksDashboard />
                    </div>
                </div>
                <div className="flex-1 min-w-[400px] h-full">
                    <div className="h-full">
                        <AIAssistantDashboard chatId={latestChatId}/>
                    </div>
                </div>
            </div>
            {/* Second Row */}
            <div className="flex gap-6 w-full h-[500px]">
                <div className="flex-[2] min-w-0">
                    <CalendarWidget mode="full"/>
                </div>
                <div className="flex-1 min-w-[400px]">
                    <ScheduleWidget/>
                </div>
            </div>
        </div>
    )
}