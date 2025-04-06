import React, { useState, useRef } from 'react';
import { loadSystemPromptFromFile } from '../lib/ai-service';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';

const SystemPromptLoader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const success = await loadSystemPromptFromFile(text);
      
      if (success) {
        toast({
          title: "系统提示词已更新",
          description: "成功从文件加载系统提示词",
          variant: "default",
        });
      } else {
        toast({
          title: "更新失败",
          description: "无法加载系统提示词",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('加载系统提示词失败:', error);
      toast({
        title: "更新失败",
        description: "读取文件时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="system-prompt-loader">
      <Input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={isLoading}
      >
        {isLoading ? '加载中...' : '加载系统提示词'}
      </Button>
    </div>
  );
};

export default SystemPromptLoader;