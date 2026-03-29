"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Trash2,
  Bot,
  User,
  X,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  citations: string | null;
  createdAt: string;
}

interface Citation {
  index: number;
  id: string;
  text: string | null;
  npsScore: number | null;
  category: string | null;
  similarity: number;
}

interface ChatPanelProps {
  projectId: string;
  onClose?: () => void;
}

export function ChatPanel({ projectId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load chat history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/projects/${projectId}/chat`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch {
        // Silently fail — empty history is fine
      }
      setLoadingHistory(false);
    }
    loadHistory();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setCitations([]);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      citations: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: userMessage }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Chat request failed");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        return;
      }

      // Add assistant response
      const assistantMsg: ChatMessage = {
        id: data.messageId,
        role: "assistant",
        content: data.response,
        citations: data.citations ? JSON.stringify(data.citations) : null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setCitations(data.citations || []);
    } catch (err) {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  }

  async function handleClearHistory() {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages([]);
        setCitations([]);
        toast.success("Chat history cleared");
      }
    } catch {
      toast.error("Failed to clear history");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Format message content — render [N] citations as badges
  function formatContent(content: string) {
    const parts = content.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        return (
          <Badge
            key={i}
            variant="secondary"
            className="mx-0.5 cursor-pointer text-xs"
            title="Cited comment"
          >
            {part}
          </Badge>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  if (collapsed) {
    return (
      <Card className="cursor-pointer" onClick={() => setCollapsed(false)}>
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="size-4" />
            Chat Analysis
            {messages.length > 0 && (
              <Badge variant="secondary">{messages.length} messages</Badge>
            )}
          </div>
          <ChevronUp className="size-4 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-medium">
            <MessageSquare className="size-4" />
            Chat Analysis
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                title="Clear history"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
            {onClose ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Close"
              >
                <X className="size-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(true)}
                title="Collapse"
              >
                <ChevronDown className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="max-h-80 overflow-y-auto space-y-3 rounded-lg border bg-muted/30 p-3">
          {loadingHistory ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" label="Loading history..." />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              Ask a question about your NPS data to get started.
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="shrink-0 mt-1">
                    <Bot className="size-4 text-blue-500" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border"
                  }`}
                >
                  {msg.role === "assistant"
                    ? formatContent(msg.content)
                    : msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 mt-1">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-2">
              <Bot className="size-4 text-blue-500 mt-1 shrink-0" />
              <div className="rounded-lg px-3 py-2 text-sm bg-card border">
                <Spinner size="sm" label="Thinking..." />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Cited comments */}
        {citations.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Cited comments:
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {citations.map((c) => (
                <div
                  key={c.id}
                  className="text-xs p-2 rounded border bg-muted/50 flex items-start gap-2"
                >
                  <Badge variant="secondary" className="shrink-0">
                    [{c.index}]
                  </Badge>
                  <span className="line-clamp-2">{c.text}</span>
                  {c.npsScore !== null && (
                    <Badge
                      variant="outline"
                      className="shrink-0 ml-auto"
                    >
                      NPS: {c.npsScore}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question about your NPS data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
