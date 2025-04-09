import React, { useState, ReactNode } from 'react';
import { UserCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ThinkingBlock from './ThinkingBlock';
import PlannerBlock from './PlannerBlock';
import WidgetCard from './WidgetCard';
import WarningMessage from './WarningMessage';
import { parseMessage } from '../lib/ai-service';
import { Message } from '../lib/db';

interface ChatMessageProps {
  message: Message;
  thinkingTime?: number;
  streamingContent?: string;
  onShowWidget?: (content: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  thinkingTime,
  streamingContent,
  onShowWidget
}) => {
  const [widgetVersions, setWidgetVersions] = useState<Record<string, number>>({});

  // 解析消息内容
  const {
    parsedMessage,
    thinking,
    widgets,
    planners,
    hasWarning
  } = parseMessage(streamingContent || message.content);

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
          <div className="flex-1 break-words whitespace-pre-wrap">{message.content}</div>
          <UserCircle className="h-5 w-5 text-grok-gray flex-shrink-0" />
        </div>
      </div>
    );
  }

  // 处理消息内容，将Widget占位符替换为实际组件
  const renderMessageContent = () => {
    // 如果没有Widget，直接返回消息内容
    if (widgets.length === 0) {
      return (
        <ReactMarkdown
          components={{
            p: ({ children }) => <div className="mb-2 break-words whitespace-pre-wrap">{children}</div>,
            code: ({ children }) => <code className="break-words whitespace-pre-wrap">{children}</code>,
            br: () => <br />
          }}
        >
          {parsedMessage}
        </ReactMarkdown>
      );
    }

    // 将消息内容按Widget占位符分割
    const parts = parsedMessage.split(/(__WIDGET_PLACEHOLDER_\d+__)/);

    return parts.map((part, index) => {
      // 检查是否是Widget占位符
      const placeholderMatch = part.match(/__WIDGET_PLACEHOLDER_(\d+)__/);

      if (placeholderMatch) {
        const widgetIndex = parseInt(placeholderMatch[1], 10);
        const widget = widgets[widgetIndex];

        if (widget) {
          return (
            <div key={`widget-${index}`} className="my-2">
              <WidgetCard
                project={widget.project}
                summary={widget.summary}
                content={widget.content}
                version={getWidgetVersion(widget.project)}
                onClick={() => onShowWidget && onShowWidget(widget.content)}
              />
            </div>
          );
        }
      }

      // 普通文本内容
      if (part.trim()) {
        return (
          <ReactMarkdown
            key={`text-${index}`}
            components={{
              p: ({ children }) => <div className="mb-2 break-words whitespace-pre-wrap">{children}</div>,
              code: ({ children }) => <code className="break-words whitespace-pre-wrap">{children}</code>,
              br: () => <br />
            }}
          >
            {part}
          </ReactMarkdown>
        );
      }

      return null;
    });
  };

  // 渲染AI消息
  return (
    <div className="ai-message">
      <div className="flex gap-2">
        <div className="w-5 h-5 bg-primary rounded-full flex-shrink-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">C</span>
        </div>
        <div className="flex-1">
          {/* 显示思考块 - 放在消息最前面 */}
          {thinking.length > 0 && (
            <ThinkingBlock
              content={thinking[0]}
              thinkingTime={thinkingTime}
            />
          )}

          {/* 显示规划块 */}
          {planners && planners.length > 0 && planners.map((planner, index) => (
            <PlannerBlock
              key={`planner-${index}`}
              content={planner.content}
              type={planner.type}
            />
          ))}

          {/* 渲染消息内容，包括内联的Widget */}
          <div className="markdown-content">
            {renderMessageContent()}
          </div>

          {/* 显示警告信息 */}
          {hasWarning && <WarningMessage />}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
