
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { getAllConversations, deleteConversation, Conversation, generateId } from '../lib';

interface ConversationListProps {
  activeConversationId: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  activeConversationId, 
  onSelectConversation,
  onNewConversation 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // 加载所有会话
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const loadedConversations = await getAllConversations();
        setConversations(loadedConversations);
      } catch (error) {
        console.error('加载会话失败:', error);
      }
    };
    
    loadConversations();
  }, []);

  // 处理删除会话
  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations(conversations.filter(conv => conv.id !== id));
      
      // 如果删除的是当前活动会话，创建一个新会话
      if (id === activeConversationId) {
        onNewConversation();
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 新建会话按钮 */}
      <div className="p-3">
        <button 
          className="grok-button w-full flex items-center justify-center gap-2"
          onClick={onNewConversation}
        >
          <PlusCircle className="h-4 w-4" />
          <span>新会话</span>
        </button>
      </div>
      
      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center py-4 text-sm text-grok-gray">
            没有会话记录
          </div>
        ) : (
          conversations.map((conversation) => (
            <div 
              key={conversation.id}
              className={`p-3 rounded-lg mb-1 cursor-pointer hover:bg-grok-darkGray/30 transition-colors
                ${activeConversationId === conversation.id ? 'bg-grok-darkGray/50 border-l-2 border-primary' : ''}`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-sm truncate">{conversation.title || '新会话'}</h3>
                <button
                  className="opacity-0 group-hover:opacity-100 text-grok-gray hover:text-destructive p-1
                    hover:bg-destructive/10 rounded transition-all"
                  onClick={(e) => handleDeleteConversation(e, conversation.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-grok-gray truncate">{conversation.lastMessage || '没有消息'}</p>
                <span className="text-xs text-grok-gray ml-2 whitespace-nowrap">
                  {formatDate(conversation.lastUpdated)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
