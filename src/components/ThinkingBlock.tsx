import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ThinkingBlockProps {
  content: string;
  thinkingTime?: number;
}

const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ content, thinkingTime }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayedTime, setDisplayedTime] = useState<string | number>(thinkingTime?.toFixed(1) || '...');
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (thinkingTime) {
      setDisplayedTime(thinkingTime.toFixed(1));
    }
  }, [thinkingTime]);

  // 计算内容高度
  const updateContentHeight = useCallback(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  // 监听内容变化
  useEffect(() => {
    updateContentHeight();
  }, [content, updateContentHeight]);

  // 监听容器宽度变化
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateContentHeight();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateContentHeight]);

  return (
    <div ref={containerRef} className="thinking-block mb-4 bg-grok-darkGray/20 rounded-lg overflow-hidden">
      <div
        className="thinking-header p-2 flex justify-between items-center cursor-pointer hover:bg-grok-darkGray/30 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-1 text-sm">
          <span>Co-Ducker {isExpanded ? "已思索" : "正在思索..."}</span>
          {displayedTime && <span>{displayedTime} 秒</span>}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>
      
      <div
        className="thinking-content overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          opacity: isExpanded ? 1 : 0
        }}
      >
        <div ref={contentRef} className="p-3 text-sm whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>
    </div>
  );
};

export default ThinkingBlock;
