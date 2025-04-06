
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const WarningMessage: React.FC = () => {
  return (
    <div className="warning-message">
      <AlertTriangle className="h-4 w-4" />
      <span>Co-Ducker 暂时不太了解这方面内容，因此我可能会犯错，请检查重要信息。</span>
    </div>
  );
};

export default WarningMessage;
