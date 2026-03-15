"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message, Attachment } from "./ChatInterface";

function AttachmentPreview({ att }: { att: Attachment }) {
  const isImage = (att.mime_type || "").startsWith("image/");
  const base64 = att.data;

  if (isImage && base64) {
    return (
      <div className="mt-2">
        <img
          src={`data:${att.mime_type};base64,${base64}`}
          alt={att.name}
          className="max-w-full max-h-64 rounded-lg border border-[var(--border)] object-contain"
        />
        <p className="text-xs text-[var(--muted)] mt-1">{att.name}</p>
      </div>
    );
  }

  const blobUrl = base64 ? `data:${att.mime_type};base64,${base64}` : null;
  return (
    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
      <span className="text-sm truncate flex-1">{att.name}</span>
      {blobUrl && (
        <a
          href={blobUrl}
          download={att.name}
          className="text-xs text-[var(--accent)] hover:underline shrink-0"
        >
          Download
        </a>
      )}
    </div>
  );
}

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-3 last:mb-0">{children}</p>,
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="ml-2">{children}</li>,
  code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
    const isBlock = !props.inline && className?.includes("language-");
    if (isBlock) {
      return (
        <code className={`block p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm overflow-x-auto ${className || ""}`} {...props}>
          {children}
        </code>
      );
    }
    return <code className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-sm font-mono" {...props}>{children}</code>;
  },
  pre: ({ children }: { children?: React.ReactNode }) => <pre className="mb-3 overflow-x-auto">{children}</pre>,
  blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="border-l-4 border-[var(--accent)] pl-4 my-3 text-[var(--muted)]">{children}</blockquote>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">{children}</a>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  table: ({ children }: { children?: React.ReactNode }) => <div className="overflow-x-auto my-3"><table className="min-w-full border border-[var(--border)] rounded-lg border-collapse">{children}</table></div>,
  th: ({ children }: { children?: React.ReactNode }) => <th className="border border-[var(--border)] px-3 py-2 text-left bg-[var(--surface)] font-medium">{children}</th>,
  td: ({ children }: { children?: React.ReactNode }) => <td className="border border-[var(--border)] px-3 py-2">{children}</td>,
  tr: ({ children }: { children?: React.ReactNode }) => <tr>{children}</tr>,
};

export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`py-4 ${msg.role === "user" ? "bg-[var(--surface)] rounded-lg px-4 mb-2" : "mb-2"}`}
        >
          <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            {msg.role === "user" ? "You" : "Assistant"}
          </span>
          <div className="mt-1 break-words markdown-content">
            {msg.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {msg.content || ""}
              </ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            )}
          </div>
          {msg.attachments?.length ? (
            <div className="space-y-1">
              {msg.attachments.map((att, j) => (
                <AttachmentPreview key={j} att={att} />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
