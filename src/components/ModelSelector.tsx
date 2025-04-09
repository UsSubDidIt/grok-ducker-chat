'use client';

import React from 'react';
import { useModel } from '../contexts/ModelContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const ModelSelector: React.FC = () => {
  const { models, selectedModel, isLoading, error, selectModel } = useModel();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>加载模型...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">加载模型失败</div>;
  }

  return (
    <Select
      value={selectedModel?.id}
      onValueChange={selectModel}
    >
      <SelectTrigger className="w-[180px] h-10 text-lg font-medium">
        <SelectValue placeholder="选择模型">
          {selectedModel && selectedModel.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col py-1">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
