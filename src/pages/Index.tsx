
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import ConversationList from '../components/ConversationList';
import Chat from '../components/Chat';
import { generateId } from '../lib';

const Index = () => {
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // 初始化：创建或加载会话ID
  useEffect(() => {
    // 如果localStorage中有会话ID则使用，否则创建新会话
    const storedConversationId = localStorage.getItem('activeConversationId');
    if (storedConversationId) {
      setActiveConversationId(storedConversationId);
    } else {
      const newConversationId = generateId();
      localStorage.setItem('activeConversationId', newConversationId);
      setActiveConversationId(newConversationId);
    }
  }, []);
  
  // 选择会话
  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    localStorage.setItem('activeConversationId', conversationId);
  };
  
  // 创建新会话
  const handleNewConversation = () => {
    const newConversationId = generateId();
    setActiveConversationId(newConversationId);
    localStorage.setItem('activeConversationId', newConversationId);
  };
  
  // 切换侧边栏
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* 侧边栏 */}
      <div 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 border-r border-grok-gray/20 overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-grok-gray/20 flex justify-between items-center">
            <h1 className="text-lg font-bold">Co-Ducker</h1>
            <button
              className="p-1 hover:bg-grok-gray/20 rounded transition-colors md:hidden"
              onClick={toggleSidebar}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList 
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </div>
        </div>
      </div>
      
      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <div className="p-4 border-b border-grok-gray/20 flex items-center">
          {!isSidebarOpen && (
            <button
              className="p-1 mr-2 hover:bg-grok-gray/20 rounded transition-colors"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-lg font-bold">对话</h2>
        </div>
        
        {/* 聊天组件 */}
        {activeConversationId && (
          <div className="flex-1 overflow-hidden">
            <Chat conversationId={activeConversationId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
