import React from 'react';
import { Code } from 'lucide-react';

interface WidgetCardProps {
  project: string;
  summary?: string;
  content: string;
  version: number;
  onClick: () => void;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ project, summary, content, version, onClick }) => {
  // 使用summary作为标题，如果没有则使用project
  const displayTitle = summary || project;
  
  return (
    <div className="widget-card" onClick={onClick}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{displayTitle}</span>
        </div>
        <div className="text-xs text-grok-gray">v{version}</div>
      </div>
    </div>
  );
};

export default WidgetCard;
