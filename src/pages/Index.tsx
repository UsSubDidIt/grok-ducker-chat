import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ConversationList from '../components/ConversationList';
import Chat from '../components/Chat';
import { generateId } from '../lib';

const Index = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // 初始化：创建或加载会话ID
  useEffect(() => {
    // 如果URL中有会话ID则使用
    if (id) {
      setActiveConversationId(id);
      localStorage.setItem('activeConversationId', id);
    }
    // 否则如果localStorage中有会话ID则使用
    else {
      const storedConversationId = localStorage.getItem('activeConversationId');
      if (storedConversationId) {
        setActiveConversationId(storedConversationId);
        // 更新URL
        navigate(`/chat/${storedConversationId}`, { replace: true });
      } else {
        // 创建新会话
        const newConversationId = generateId();
        localStorage.setItem('activeConversationId', newConversationId);
        setActiveConversationId(newConversationId);
        // 更新URL
        navigate(`/chat/${newConversationId}`, { replace: true });
      }
    }
  }, [id, navigate]);
  
  // 选择会话
  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    localStorage.setItem('activeConversationId', conversationId);
    // 更新URL
    navigate(`/chat/${conversationId}`);
  };
  
  // 创建新会话
  const handleNewConversation = () => {
    const newConversationId = generateId();
    setActiveConversationId(newConversationId);
    localStorage.setItem('activeConversationId', newConversationId);
    // 更新URL
    navigate(`/chat/${newConversationId}`);
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
            <div className="flex items-center gap-2">
              <button
                className="p-1 hover:bg-grok-gray/20 rounded transition-colors md:hidden"
                onClick={toggleSidebar}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
      <div className="flex-1 flex flex-col overflow-hidden relative">
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
        
        {/* 右下角折叠按钮 */}
        <button
          className="absolute bottom-4 right-4 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          onClick={toggleSidebar}
          title={isSidebarOpen ? "折叠侧边栏" : "展开侧边栏"}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export default Index;
