import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle } from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";

export const ChatWindow = ({ isOpen, onToggle, boardId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { socket } = useSocket();
  const { token } = useAuth();

  // Debug logging
  console.log('ChatWindow props:', { isOpen, boardId, hasToken: !!token, hasSocket: !!socket });

  // Load chat history when component mounts or boardId changes
  useEffect(() => {
    if (boardId && token) {
      loadChatHistory();
    } else {
      // Set default welcome message if no boardId
      setMessages([{
        id: "welcome",
        text: "Welcome to the collaborative whiteboard! Start chatting with your team.",
        username: "System",
        timestamp: new Date(),
      }]);
      setLoading(false);
    }
  }, [boardId, token]);

  useEffect(() => {
    if (socket) {
      socket.on('chat-message', handleNewMessage);
      
      return () => {
        socket.off('chat-message');
      };
    }
  }, [socket]);

  const loadChatHistory = async () => {
    if (!boardId || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/chat/${boardId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const chatHistory = await response.json();
        setMessages(chatHistory.length > 0 ? chatHistory : [{
          id: "welcome",
          text: "Welcome to the collaborative whiteboard! Start chatting with your team.",
          username: "System",
          timestamp: new Date(),
        }]);
      } else {
        console.error('Failed to load chat history');
        setMessages([{
          id: "welcome",
          text: "Welcome to the collaborative whiteboard! Start chatting with your team.",
          username: "System",
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([{
        id: "welcome",
        text: "Welcome to the collaborative whiteboard! Start chatting with your team.",
        username: "System",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewMessage = (messageData) => {
    setMessages(prev => [...prev, {
      id: messageData.id,
      text: messageData.text,
      username: messageData.username,
      timestamp: new Date(messageData.timestamp)
    }]);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !boardId) return;

    socket.emit('chat-message', {
      boardId,
      text: newMessage
    });

    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    );
  }

  // Safety check to prevent crashes
  if (!boardId) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 h-96 bg-white border shadow-lg">
        <div className="flex flex-col h-full bg-white rounded-lg">
          <div className="p-4 border-b bg-gradient-to-r from-primary to-accent rounded-t-lg">
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
          <div className="flex-1 p-4 bg-gray-50 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading board...</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 bg-white border shadow-lg">
      <div className="flex flex-col h-full bg-white rounded-lg">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-primary to-accent rounded-t-lg">
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
        <ScrollArea className="flex-1 p-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">Loading chat...</div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.username === "You" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.username === "You"
                      ? "bg-primary text-primary-foreground"
                      : message.username === "System"
                      ? "bg-muted text-muted-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {message.username} • {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-white rounded-b-lg">
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