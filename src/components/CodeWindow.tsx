import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/atom-one-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('javascript', javascript);

interface CodeWindowProps {
  content: string;
  onClose: () => void;
}

const CodeWindow: React.FC<CodeWindowProps> = ({ content, onClose }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [content]);
  
  // 复制代码到剪贴板
  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      // 2秒后重置复制状态
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="code-window h-full flex flex-col border-l border-grok-gray/20 bg-grok-darkPurple/60 animate-fade-in">
      <div className="flex justify-between items-center p-3 border-b border-grok-gray/20">
        <div className="text-sm font-medium">代码查看器</div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-grok-gray/20 rounded-full transition-colors"
            title="复制代码"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-grok-gray/20 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="overflow-auto flex-1 p-4">
        <pre className="h-full">
          <code ref={codeRef} className="javascript rounded-md h-full">
            {content}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeWindow;
