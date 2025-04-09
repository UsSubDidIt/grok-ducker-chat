'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// 模型接口
export interface Model {
  id: string;
  name: string;
  description: string;
  provider: string;
  contextLength: number;
}

// 上下文接口
interface ModelContextType {
  models: Model[];
  selectedModel: Model | null;
  isLoading: boolean;
  error: string | null;
  selectModel: (modelId: string) => void;
}

// 创建上下文
const ModelContext = createContext<ModelContextType>({
  models: [],
  selectedModel: null,
  isLoading: false,
  error: null,
  selectModel: () => {}
});

// 上下文提供者组件
export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 加载模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/models');

        if (!response.ok) {
          throw new Error(`获取模型列表失败: ${response.status}`);
        }

        const data = await response.json();
        setModels(data);

        // 如果有模型，默认选择第一个
        if (data.length > 0) {
          // 检查本地存储中是否有之前选择的模型
          const savedModelId = localStorage.getItem('selectedModelId');
          const modelToSelect = savedModelId
            ? data.find((m: Model) => m.id === savedModelId) || data[0]
            : data[0];

          setSelectedModel(modelToSelect);
          localStorage.setItem('selectedModelId', modelToSelect.id);
        }
      } catch (error) {
        console.error('加载模型列表失败:', error);
        setError(error instanceof Error ? error.message : '未知错误');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  // 选择模型
  const selectModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      localStorage.setItem('selectedModelId', model.id);
    }
  };

  return (
    <ModelContext.Provider
      value={{
        models,
        selectedModel,
        isLoading,
        error,
        selectModel
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

// 自定义钩子，用于访问上下文
export const useModel = () => useContext(ModelContext);
