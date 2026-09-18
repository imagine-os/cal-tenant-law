import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import './MarkdownViewer.css';

export interface MarkdownViewerProps {
  source: string;
  /** Resolve a relative image path (relative to the document) to a URL. */
  resolveImage?: (src: string) => string | undefined;
  /** Resolve a relative link to an in-app route; return undefined to keep it external. */
  resolveLink?: (href: string) => string | undefined;
  className?: string;
}

/** Renders markdown (docs, changelogs, prompts, manual) with images and links resolved through the caller. */
export function MarkdownViewer({ source, resolveImage, resolveLink, className = '' }: MarkdownViewerProps) {
  return (
    <div className={`prose markdown ${className}`}>
      <ReactMarkdown components={{
        img: ({ src, alt, title }) => { const url = src ? resolveImage?.(src) ?? src : ''; return <img src={url} alt={alt ?? ''} title={title} loading="lazy" />; },
        a: ({ href, children }) => {
          const to = href ? resolveLink?.(href) : undefined;
          if (to) return <Link to={to}>{children}</Link>;
          const ext = /^https?:/.test(href ?? '');
          return <a href={href} target={ext ? '_blank' : undefined} rel={ext ? 'noreferrer' : undefined}>{children}</a>;
        },
        table: ({ children }) => <div className="markdown-table"><table>{children}</table></div>,
      }}>{source}</ReactMarkdown>
    </div>
  );
}
