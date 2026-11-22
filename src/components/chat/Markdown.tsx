import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders agent replies as GitHub-flavoured Markdown. */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="md text-[14.5px] leading-6 text-fg/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#7cc4ff] underline-offset-2 hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
