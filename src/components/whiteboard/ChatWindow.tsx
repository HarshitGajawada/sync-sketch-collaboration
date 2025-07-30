import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle } from "lucide-react";

export interface Message {
  id: string;
  text: string;
  user: string;
  timestamp: Date;
}

export interface ChatWindowProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatWindow = ({ isOpen, onToggle }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Welcome to Sync Sketch! Start collaborating on the whiteboard.",
      user: "System",
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      user: "You", // In a real app, this would be the current user's name
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-[var(--shadow-elegant)]"
        size="icon"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 bg-chat-bg border shadow-[var(--shadow-elegant)]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary to-accent">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-primary-foreground">Team Chat</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-primary-foreground hover:bg-white/20"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.user === "You" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.user === "You"
                      ? "bg-primary text-primary-foreground"
                      : message.user === "System"
                      ? "bg-muted text-muted-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {message.user} • {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};