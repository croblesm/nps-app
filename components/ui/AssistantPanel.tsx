"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/Spinner";
import {
  Bot,
  User,
  Send,
  X,
  Sparkles,
} from "lucide-react";

interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface PageContext {
  [key: string]: unknown;
}

interface AssistantPanelProps {
  projectId: string;
  page: string;
  pageContext: PageContext;
}

export function AssistantPanel({
  projectId,
  page,
  pageContext,
}: AssistantPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          page,
          message: userMessage,
          pageContext,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Assistant request failed");
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        return;
      }

      const assistantMsg: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      toast.error("Failed to reach the assistant");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-16 left-6 z-50 flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-4 py-3 shadow-lg hover:bg-secondary/80 transition-colors"
        title="Open AI Assistant"
      >
        <Sparkles className="size-5" />
        <span className="text-sm font-medium">Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 left-6 z-50 w-[380px] h-[500px] shadow-2xl rounded-xl border border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          AI Assistant
          <span className="text-xs text-muted-foreground">({page})</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            Ask me anything about your NPS data or this workflow step.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="shrink-0 mt-1">
                  <Bot className="size-4 text-primary" />
                </div>
              )}
              <div
                className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content}
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
            <Bot className="size-4 text-primary mt-1 shrink-0" />
            <div className="rounded-lg px-3 py-2 text-sm bg-muted">
              <Spinner size="sm" label="Thinking..." />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-border">
        <Input
          placeholder="Ask about this step..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending || !input.trim()}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
