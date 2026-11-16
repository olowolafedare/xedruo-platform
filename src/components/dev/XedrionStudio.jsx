import React, { useState } from "react";
import { Bot, Code2, Bug, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const MODES = [
  { value: "normal", label: "Ask / plan", icon: Sparkles },
  { value: "code", label: "Code / debug", icon: Code2 },
];

export default function XedrionStudio({ project }) {
  const [mode, setMode] = useState("normal");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  async function sendMessage(event) {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setPrompt("");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/dev/xedrion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          projectSlug: project.slug,
          mode,
          query: text,
          conversation: messages.slice(-8),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || "Xedrion request failed");
      setMessages(current => [...current, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setError(err.message || "Could not reach Xedrion AI.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-card border border-primary/30 p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold">Xedrion AI Developer</h3>
          <p className="text-xs text-muted-foreground">Shared Xedrion engine · {project.name}</p>
        </div>
        <span className="text-[10px] rounded-full border border-emerald-500/40 px-2 py-1 text-emerald-500">AI gateway</span>
      </div>

      <div className="flex gap-2 mb-4">
        {MODES.map(item => {
          const Icon = item.icon;
          return (
            <Button key={item.value} type="button" size="sm" variant={mode === item.value ? "default" : "outline"} onClick={() => setMode(item.value)}>
              <Icon className="w-3.5 h-3.5 mr-1.5" /> {item.label}
            </Button>
          );
        })}
      </div>

      <div className="min-h-36 max-h-[460px] overflow-y-auto rounded-xl bg-background border border-border p-3 space-y-3 mb-3">
        {!messages.length && (
          <div className="py-8 text-center">
            <Bot className="w-8 h-8 mx-auto mb-2 text-primary/70" />
            <p className="text-sm font-medium">What should Xedrion work on?</p>
            <p className="text-xs text-muted-foreground mt-1">Ask it to design, write, explain, debug or review code for this project.</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={message.role === "user" ? "ml-8 rounded-xl bg-primary/10 p-3" : "mr-3 rounded-xl bg-muted p-3"}>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{message.role === "user" ? "You" : "Xedrion AI"}</div>
            <pre className="whitespace-pre-wrap break-words text-sm font-sans">{message.content}</pre>
          </div>
        ))}
        {busy && <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Xedrion is working…</div>}
      </div>

      {error && <p role="alert" className="text-xs text-destructive mb-2">{error}</p>}
      <form onSubmit={sendMessage} className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={prompt}
          onChange={event => setPrompt(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }}
          placeholder={mode === "code" ? "Paste code or describe the bug / implementation task…" : "Describe what you want to build or investigate…"}
          rows={3}
          maxLength={12000}
          className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !prompt.trim()} className="sm:self-end">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />} Send
        </Button>
      </form>
      <p className="text-[11px] text-muted-foreground mt-2">This first connection provides AI assistance. Repository writes, terminal execution and cloud changes are separate permissioned tools and are not enabled by this chat alone.</p>
    </section>
  );
}
