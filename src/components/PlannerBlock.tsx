import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface PlannerBlockProps {
  content: string;
  type: string;
}

const PlannerBlock: React.FC<PlannerBlockProps> = ({ content, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

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

  // 根据类型显示不同的标题
  const getTitle = () => {
    if (type === 'general_widget') {
      return '控件规划';
    } else if (type === 'widget_project') {
      return '项目规划';
    }
    return '规划';
  };

  return (
    <div ref={containerRef} className="planner-block mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800">
      <div
        className="planner-header p-2 flex justify-between items-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-1 text-sm">
          <Lightbulb className="h-4 w-4 text-blue-500" />
          <span>Shine 已思索{getTitle()}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>
      
      <div
        className="planner-content overflow-hidden transition-all duration-300"
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

export default PlannerBlock;
