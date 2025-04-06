
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ThinkingBlockProps {
  content: string;
  thinkingTime?: number;
}

const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ content, thinkingTime }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayedTime, setDisplayedTime] = useState<string | number>(thinkingTime?.toFixed(1) || '...');

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (thinkingTime) {
      setDisplayedTime(thinkingTime.toFixed(1));
    }
  }, [thinkingTime]);

  return (
    <div className="thinking-block">
      <div className="thinking-header" onClick={toggleExpanded}>
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
      
      {isExpanded && (
        <div className="thinking-content">
          {content}
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
