
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/atom-one-dark.css';

hljs.registerLanguage('javascript', javascript);

interface CodeWindowProps {
  content: string;
  onClose: () => void;
}

const CodeWindow: React.FC<CodeWindowProps> = ({ content, onClose }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [content]);

  return (
    <div className="code-window h-full flex flex-col border-l border-grok-gray/20 bg-grok-darkPurple/60 animate-fade-in">
      <div className="flex justify-between items-center p-3 border-b border-grok-gray/20">
        <div className="text-sm font-medium">代码查看器</div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-grok-gray/20 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
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
