'use client'

import React, { useEffect, useState } from 'react';
import AIAssistantFull from '@/components/ai-assistant-full';

type Props = {
    params: Promise<{
        chatId: string;
    }>;
};

export default function AssistantPage({ params }: Props) {
    const [chatId, setChatId] = useState<string | null>(null);

    useEffect(() => {
        const fetchParams = async () => {
            const resolvedParams = await params; // Wait for the Promise to resolve
            setChatId(resolvedParams.chatId); // Set the chatId in state
        };

        fetchParams();
    }, [params]);

    if (chatId === null) return <div>Loading...</div>; // Handle loading state

    return (
        <div className="container mx-auto p-4 h-full w-full">
            <AIAssistantFull chatId={chatId} />
        </div>
    );
}