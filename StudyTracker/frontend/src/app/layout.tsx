import React from 'react'
import {ThemeProvider} from '@/components/theme-provider'
import {ChatProvider} from '@/contexts/chat-context'

import '@/app/globals.css'
import AppSidebar from "@/components/sidebar";
import {SidebarProvider} from "@/components/ui/sidebar"

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="bg-background text-foreground scroll-container">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <ChatProvider>
                <SidebarProvider defaultOpen={true}>
                    <AppSidebar/>
                    <div className="ml-4 flex-1 flex flex-col items-center">
                        <div className="container mx-auto w-full">
                            {children}
                        </div>
                    </div>
                </SidebarProvider>
            </ChatProvider>
        </ThemeProvider>

        </body>
        </html>
    )
}