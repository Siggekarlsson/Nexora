/** Minimal markdown: headings, bullets, bold. Enough for agent replies. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="font-semibold text-fg">{part.slice(2, -2)}</strong> : part,
  );
}

export function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 space-y-1 pl-4">
          {list.map((li, i) => (
            <li key={i} className="list-disc marker:text-faint">{inline(li)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  text.split("\n").forEach((line, i) => {
    if (/^\s*[-*] /.test(line)) return list.push(line.replace(/^\s*[-*] /, ""));
    flush();
    if (/^#{1,3} /.test(line)) blocks.push(<div key={i} className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{line.replace(/^#+ /, "")}</div>);
    else if (line.trim()) blocks.push(<p key={i} className="my-1.5">{inline(line)}</p>);
  });
  flush();
  return <div className="text-[14.5px] leading-6 text-fg/90">{blocks}</div>;
}
