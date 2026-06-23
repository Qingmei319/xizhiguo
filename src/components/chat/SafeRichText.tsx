import { Fragment, createElement, useMemo } from 'react';
import type { ReactNode } from 'react';
import './SafeRichText.less';

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

const DROPPED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'link', 'meta']);
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

function renderNode(node: ChildNode, key: string): ReactNode {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  if (DROPPED_TAGS.has(tagName)) return null;

  const children = Array.from(element.childNodes).map((child, index) => renderNode(child, `${key}-${index}`));
  if (!ALLOWED_TAGS.has(tagName)) return createElement(Fragment, { key }, children);

  return createElement(tagName, { key }, children);
}

export function htmlToPlainText(value: string) {
  if (!HTML_TAG_PATTERN.test(value) || typeof DOMParser === 'undefined') return value;

  const document = new DOMParser().parseFromString(value, 'text/html');
  return document.body.textContent || '';
}

export function normalizeChatText(value: string) {
  return htmlToPlainText(value).replace(/\s+/g, ' ').trim();
}

export function SafeRichText({ content, className }: { content: string; className?: string }) {
  const hasHtml = HTML_TAG_PATTERN.test(content);
  const nodes = useMemo(() => {
    if (!hasHtml || typeof DOMParser === 'undefined') return content;

    const document = new DOMParser().parseFromString(content, 'text/html');
    return Array.from(document.body.childNodes).map((node, index) => renderNode(node, `${index}`));
  }, [content, hasHtml]);

  return <div className={`safe-rich-text ${hasHtml ? '' : 'plain'} ${className || ''}`.trim()}>{nodes}</div>;
}
