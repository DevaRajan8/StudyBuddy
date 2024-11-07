"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChats } from "@/contexts/chat-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export default function AIAssistantDashboard({ chatId }: { chatId?: string }) {
  const { setChats } = useChats();
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [shouldFocus, setShouldFocus] = useState(false);

  // ...keep only essential methods...

  const createNewChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "DashChat" }),
      });
      const newChat = await response.json();
      setChats((prev) => [...prev, newChat]);
      setCurrentChat(newChat);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !chatId || !currentChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setCurrentChat((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMessage],
          }
        : null
    );
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/chats/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newMessage),
        }
      );
      if (!response.ok) throw new Error("Failed to send message");
      const data = await response.json();

      setCurrentChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, data],
            }
          : null
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatId) {
      const fetchChat = async () => {
        try {
          const response = await fetch(`http://localhost:5000/chats/${chatId}`);
          if (!response.ok) throw new Error("Failed to fetch chat");
          const data = await response.json();
          setCurrentChat(data);
        } catch (error) {
          console.error("Failed to fetch chat:", error);
        }
      };
      fetchChat();
    }
  }, [chatId]);

  if (!chatId || !currentChat) {
    return (
      <Card className="w-full h-full flex flex-col">
        <CardContent className="flex-grow flex flex-col items-center justify-center p-6">
          <p className="text-muted-foreground mb-4">Start a new conversation</p>
          <Button onClick={createNewChat}>Create New Chat</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardContent className="flex-grow flex flex-col overflow-hidden p-6">
        <ScrollArea className="flex-grow pr-4">
          {currentChat.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <div
                className={`flex items-start space-x-2 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar>
                  <AvatarFallback>
                    {message.role === "user" ? <User /> : <Bot />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>
        <div className="flex items-center space-x-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            autoFocus={shouldFocus}
          />
          <Button onClick={sendMessage} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
