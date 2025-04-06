
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isProcessing }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleSendMessage = () => {
    if (message.trim() && !isProcessing) {
      onSendMessage(message.trim());
      setMessage('');
      
      // 重置文本区高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className="chat-input w-full rounded-xl p-3 pr-12 max-h-[200px] min-h-[52px]"
        placeholder="发送消息给 Co-Ducker..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isProcessing}
        rows={1}
      />
      <button
        className="absolute right-2 bottom-2 p-2 rounded-lg text-primary disabled:text-grok-gray/50 
          transition-colors hover:bg-primary/10 disabled:hover:bg-transparent"
        onClick={handleSendMessage}
        disabled={!message.trim() || isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

export default ChatInput;
