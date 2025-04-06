
import React, { useState } from 'react';
import { UserCircle } from 'lucide-react';
import ThinkingBlock from './ThinkingBlock';
import WidgetCard from './WidgetCard';
import WarningMessage from './WarningMessage';
import { parseMessage } from '../lib/ai-service';
import { Message } from '../lib/db';

interface ChatMessageProps {
  message: Message;
  thinkingTime?: number;
  onShowWidget?: (content: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  thinkingTime,
  onShowWidget
}) => {
  const [widgetVersions, setWidgetVersions] = useState<Record<string, number>>({});
  
  // 解析消息内容
  const { 
    parsedMessage, 
    thinking, 
    widgets, 
    hasWarning 
  } = parseMessage(message.content);

  // 获取项目的版本号
  const getWidgetVersion = (project: string) => {
    if (!widgetVersions[project]) {
      setWidgetVersions(prev => ({ ...prev, [project]: 1 }));
      return 1;
    }
    return widgetVersions[project];
  };

  // 渲染用户消息
  if (message.role === 'user') {
    return (
      <div className="user-message">
        <div className="flex gap-2">
          <div className="flex-1">{message.content}</div>
          <UserCircle className="h-5 w-5 text-grok-gray flex-shrink-0" />
        </div>
      </div>
    );
  }

  // 渲染AI消息
  return (
    <div className="ai-message">
      <div className="flex gap-2">
        <div className="w-5 h-5 bg-primary rounded-full flex-shrink-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">C</span>
        </div>
        <div className="flex-1">
          {parsedMessage}
          
          {/* 显示思考块 */}
          {thinking.length > 0 && (
            <ThinkingBlock 
              content={thinking[0]} 
              thinkingTime={thinkingTime}
            />
          )}
          
          {/* 显示Widget卡片 */}
          {widgets.map((widget, index) => (
            <WidgetCard 
              key={index}
              project={widget.project}
              content={widget.content}
              version={getWidgetVersion(widget.project)}
              onClick={() => onShowWidget && onShowWidget(widget.content)}
            />
          ))}
          
          {/* 显示警告信息 */}
          {hasWarning && <WarningMessage />}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
