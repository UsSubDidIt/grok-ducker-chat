import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import CodeWindow from './CodeWindow';
import { sendMessageToAI, generateId, generateConversationTitle, cancelCurrentRequest } from '../lib/ai-service';
import { saveMessage, getConversationMessages, saveConversation, Message, Conversation } from '../lib/db';
import { parseMessage } from '../lib/ai-service';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface ChatProps {
  conversationId: string;
}

const Chat: React.FC<ChatProps> = ({ conversationId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [thinkingTime, setThinkingTime] = useState<number | undefined>(undefined);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 加载会话消息
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // 如果正在处理消息，取消当前请求
        if (isProcessing) {
          cancelCurrentRequest();
          setIsProcessing(false);
          setStreamingContent('');
        }
        
        // 关闭代码浏览器
        setActiveWidget(null);
        
        const loadedMessages = await getConversationMessages(conversationId);
        setMessages(loadedMessages);
        // 检查是否为第一次对话
        setIsFirstMessage(loadedMessages.length === 0);
        
        // 检查最后一条消息是否有代码窗口，如果有则打开
        if (loadedMessages.length > 0) {
          const lastMessage = loadedMessages[loadedMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            const { widgets } = parseMessage(lastMessage.content);
            if (widgets.length > 0) {
              setActiveWidget(widgets[widgets.length - 1].content);
            }
          }
        }
      } catch (error) {
        console.error('加载消息失败:', error);
      }
    };
    
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
      setIsFirstMessage(true);
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

  // 处理流式响应
  const handlePartialResponse = (partialResponse: string) => {
    setStreamingContent(partialResponse);
  };

  // 及时保存消息
  const saveMessageImmediately = async (message: Message) => {
    try {
      await saveMessage(message);
      return true;
    } catch (error) {
      console.error('保存消息失败:', error);
      return false;
    }
  };

  // 取消当前请求
  const handleCancelResponse = () => {
    if (isProcessing) {
      cancelCurrentRequest();
      setIsProcessing(false);
      setStreamingContent('');
      
      // 移除最后一条未完成的AI消息
      if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage.content) {
          setMessages(prev => prev.slice(0, -1));
        }
      }
    }
  };

  // 发送消息
  const handleSendMessage = async (content: string) => {
    // 如果正在处理消息，先取消当前请求
    if (isProcessing) {
      handleCancelResponse();
    }
    
    // 创建用户消息
    const userMessage: Message = {
      id: generateId(),
      conversationId,
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    // 立即保存用户消息
    await saveMessageImmediately(userMessage);
    setMessages(prev => [...prev, userMessage]);
    setThinkingTime(undefined);
    setIsProcessing(true);
    setStreamingContent('');

    try {
      // 获取并发送所有消息历史到AI
      const updatedMessages = [...messages, userMessage];
      const aiMessageId = generateId();
      
      // 创建临时AI消息用于流式显示
      const tempAssistantMessage: Message = {
        id: aiMessageId,
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      
      // 添加临时消息到UI
      setMessages(prev => [...prev, tempAssistantMessage]);
      
      // 使用流式API获取响应
      const aiResponse = await sendMessageToAI(
        updatedMessages,
        handleThinking,
        handlePartialResponse,
        (error) => {
          console.error('AI响应错误:', error);
          // 错误处理逻辑
        }
      );
      
      // 更新AI响应消息
      const assistantMessage: Message = {
        ...tempAssistantMessage,
        content: aiResponse
      };
      
      // 保存最终的AI响应
      await saveMessageImmediately(assistantMessage);
      
      // 更新消息列表
      setMessages(prev =>
        prev.map(msg => msg.id === aiMessageId ? assistantMessage : msg)
      );
      
      // 如果是第一次对话，生成会话标题
      if (isFirstMessage) {
        try {
          const title = await generateConversationTitle(content);
          
          // 更新会话标题与最后消息
          const conversation: Conversation = {
            id: conversationId,
            title: title,
            lastMessage: aiResponse.substring(0, 50),
            lastUpdated: Date.now(),
            createdAt: updatedMessages[0].timestamp
          };
          
          await saveConversation(conversation);
          setIsFirstMessage(false);
        } catch (error) {
          console.error('生成会话标题失败:', error);
          
          // 如果生成标题失败，使用默认标题
          const conversation: Conversation = {
            id: conversationId,
            title: content.substring(0, 30),
            lastMessage: aiResponse.substring(0, 50),
            lastUpdated: Date.now(),
            createdAt: updatedMessages[0].timestamp
          };
          
          await saveConversation(conversation);
        }
      } else {
        // 更新会话最后消息
        const conversation: Conversation = {
          id: conversationId,
          title: updatedMessages[0].content.substring(0, 30),
          lastMessage: aiResponse.substring(0, 50),
          lastUpdated: Date.now(),
          createdAt: updatedMessages[0].timestamp
        };
        
        await saveConversation(conversation);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsProcessing(false);
      setStreamingContent('');
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
    <ResizablePanelGroup direction="horizontal">
      {/* 对话区域 */}
      <ResizablePanel defaultSize={activeWidget ? 40 : 100} minSize={30}>
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto max-w-4xl p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-grok-gray">
                  <div className="text-3xl font-bold mb-2">Co-Ducker</div>
                  <div className="text-sm">AI对话助手，开始聊天吧！</div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    thinkingTime={
                      message.role === 'assistant' &&
                      index === messages.length - 1 ?
                      thinkingTime : undefined
                    }
                    streamingContent={
                      message.role === 'assistant' &&
                      index === messages.length - 1 &&
                      isProcessing ?
                      streamingContent : undefined
                    }
                    onShowWidget={handleShowWidget}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <ChatInput onSendMessage={handleSendMessage} isProcessing={isProcessing} />
        </div>
      </ResizablePanel>

      {/* 代码查看器 */}
      {activeWidget && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full animate-slide-in">
              <CodeWindow 
                content={activeWidget} 
                onClose={() => setActiveWidget(null)} 
              />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};

export default Chat;
