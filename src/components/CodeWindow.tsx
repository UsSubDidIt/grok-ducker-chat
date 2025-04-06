import React, { useRef, useEffect, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import hljs from 'highlight.js';

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
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 下载控件代码
  const handleDownload = () => {
    try {
      // 从内容中提取 project 参数
      const projectMatch = content.match(/project="([^"]+)"/);
      const fileName = projectMatch ? projectMatch[1] : 'widget';

      // 创建 Blob 对象
      const blob = new Blob([content], { type: 'text/plain' });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName; // 使用 project 参数作为文件名，不带后缀
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
    }
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
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            title="下载控件代码"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">下载</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="h-full m-0">
          <code ref={codeRef} className="language-javascript">
            {content}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeWindow;
