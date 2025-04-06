
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import CodeWindow from './CodeWindow';
import { sendMessageToAI, generateId } from '../lib/ai-service';
import { saveMessage, getConversationMessages, saveConversation, Message, Conversation } from '../lib/db';

interface ChatProps {
  conversationId: string;
}

const Chat: React.FC<ChatProps> = ({ conversationId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [thinkingTime, setThinkingTime] = useState<number | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 加载会话消息
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const loadedMessages = await getConversationMessages(conversationId);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('加载消息失败:', error);
      }
    };
    
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理思考状态回调
  const handleThinking = (isThinking: boolean, time?: number) => {
    if (!isThinking && time) {
      setThinkingTime(time);
    }
  };

  // 发送消息
  const handleSendMessage = async (content: string) => {
    // 创建并保存用户消息
    const userMessage: Message = {
      id: generateId(),
      conversationId,
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    await saveMessage(userMessage);
    setMessages(prev => [...prev, userMessage]);
    setThinkingTime(undefined);
    setIsProcessing(true);

    try {
      // 获取并发送所有消息历史到AI
      const updatedMessages = [...messages, userMessage];
      const aiResponse = await sendMessageToAI(updatedMessages, handleThinking);
      
      // 创建并保存AI响应消息
      const assistantMessage: Message = {
        id: generateId(),
        conversationId,
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
      };
      
      await saveMessage(assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
      
      // 更新会话标题与最后消息
      const conversation: Conversation = {
        id: conversationId,
        title: messages.length === 0 ? content.substring(0, 30) : updatedMessages[0].content.substring(0, 30),
        lastMessage: aiResponse.substring(0, 50),
        lastUpdated: Date.now(),
        createdAt: updatedMessages[0].timestamp
      };
      
      await saveConversation(conversation);
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 重试最后一条消息
  const handleRetry = async () => {
    // 只有当最后一条是用户消息时才能重试
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastMessage = messages[messages.length - 1];
      handleSendMessage(lastMessage.content);
    }
  };

  // 处理显示代码窗口
  const handleShowWidget = (content: string) => {
    setActiveWidget(content);
  };

  return (
    <div className="flex h-full">
      <div className={`flex flex-col h-full ${activeWidget ? 'w-1/3' : 'w-full'} transition-all duration-200`}>
        {/* 聊天消息区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-grok-gray">
              <div className="text-3xl font-bold mb-2">Co-Ducker</div>
              <div className="text-sm">AI对话助手，开始聊天吧！</div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message}
                thinkingTime={
                  message.role === 'assistant' && 
                  message === messages[messages.length - 1] ? 
                  thinkingTime : undefined
                }
                onShowWidget={handleShowWidget}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 底部输入区域 */}
        <div className="p-4 border-t border-grok-gray/20">
          <div className="flex items-center mb-2">
            {isProcessing ? (
              <div className="text-xs text-grok-gray flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Co-Ducker 正在回复...
              </div>
            ) : (
              messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <button 
                  className="text-xs flex items-center text-grok-gray hover:text-primary transition-colors"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  重新生成回复
                </button>
              )
            )}
          </div>
          <ChatInput onSendMessage={handleSendMessage} isProcessing={isProcessing} />
        </div>
      </div>
      
      {/* 代码窗口 */}
      {activeWidget && (
        <div className="w-2/3 h-full animate-slide-in">
          <CodeWindow 
            content={activeWidget} 
            onClose={() => setActiveWidget(null)} 
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
