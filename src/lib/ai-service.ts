import { Message } from './db';

// API信息 - 使用本地Next.js API路由
const API_BASE_URL = '/api/chat';
const SYSTEM_PROMPT_FILE = 'system-prompt.txt';

// 系统提示词现在由服务器端强制执行，不再在客户端加载

// 用于存储当前请求的控制器，以便能够取消请求
let currentController: AbortController | null = null;

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 取消当前请求
export const cancelCurrentRequest = () => {
  if (currentController) {
    currentController.abort();
    currentController = null;
    return true;
  }
  return false;
};

// 系统提示词现在由服务器端强制执行，客户端不再需要加载
export const loadSystemPromptFromFile = async (fileContent: string) => {
  // 此功能已移至服务器端，但保留API兼容性
  console.warn('系统提示词现在由服务器端强制执行，客户端设置将被忽略');
  return true;
};

// 获取当前选择的模型ID
const getSelectedModelId = (): string => {
  try {
    // 从本地存储中获取选择的模型ID
    return localStorage.getItem('selectedModelId') || 'openrouter/quasar-alpha';
  } catch (error) {
    console.error('获取模型ID失败:', error);
    return 'openrouter/quasar-alpha'; // 默认模型
  }
};

// 处理发送消息到AI (流式响应)
export const sendMessageToAI = async (
  messages: Message[],
  onThinking?: (isThinking: boolean, time?: number) => void,
  onPartialResponse?: (partialResponse: string) => void,
  onError?: (error: Error) => void
): Promise<string> => {
  // 记录思考开始时间
  const thinkingStartTime = Date.now();
  onThinking?.(true);

  try {
    // 获取当前选择的模型ID
    const modelId = getSelectedModelId();

    // 转换为自定义格式的消息
    const customMessages = messages.map(msg => ({
      sender: msg.role,  // 使用自定义格式
      text: msg.content, // 使用自定义格式
      timestamp: msg.timestamp
    }));

    // 创建新的AbortController
    currentController = new AbortController();
    const signal = currentController.signal;

    // 使用自定义API
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: customMessages,
        settings: {
          temperature: 0.45,
          max_length: 4096  // 使用自定义参数名
        },
        stream: true, // 启用流式响应
        modelId // 添加模型ID
      }),
      signal // 添加信号以支持取消
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';
    let buffer = '';
    let isThinkingEnded = false;

    // 处理自定义格式的流式响应
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 处理SSE格式的数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[COMPLETE]') continue; // 使用自定义完成标记

          try {
            const json = JSON.parse(data);
            const content = json.chunk || ''; // 使用自定义格式
            if (content) {
              fullResponse += content;

              // 检查思考部分是否结束
              if (!isThinkingEnded && fullResponse.includes('</Thinking>')) {
                isThinkingEnded = true;
                const thinkingTime = (Date.now() - thinkingStartTime) / 1000;
                onThinking?.(false, thinkingTime);
              }

              onPartialResponse?.(fullResponse);
            }
          } catch (e) {
            console.error('解析流式响应失败:', e);
          }
        }
      }
    }

    if (!isThinkingEnded) {
      const thinkingTime = (Date.now() - thinkingStartTime) / 1000;
      onThinking?.(false, thinkingTime);
    }

    // 清除控制器引用
    currentController = null;
    return fullResponse;
  } catch (error) {
    console.error('AI请求失败:', error);
    onThinking?.(false);

    // 如果是取消请求，不抛出错误
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('请求已取消');
      onError?.(error);
      return '请求已取消';
    }

    onError?.(error);
    throw error;
  }
};

// 生成会话标题
export const generateConversationTitle = async (firstMessage: string): Promise<string> => {
  try {
    // 获取当前选择的模型ID
    const modelId = getSelectedModelId();

    const response = await fetch(API_BASE_URL, {
      method: 'PUT', // 使用PUT方法区分不同的操作
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: firstMessage,
        modelId // 添加模型ID
      })
    });

    if (!response.ok) {
      throw new Error(`生成标题API请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.title.replace(/["']/g, '').trim();
  } catch (error) {
    console.error('生成会话标题失败:', error);
    // 如果失败，返回截断的消息作为标题
    return firstMessage.substring(0, 20) + (firstMessage.length > 20 ? '...' : '');
  }
};

// 解析特殊标签
export const parseMessage = (message: string) => {
  const thinkingRegex = /<Thinking>([\s\S]*?)<\/Thinking>/g;
  const widgetRegex = /<Widget project="([\s\S]*?)" summary="([\s\S]*?)">([\s\S]*?)<\/Widget>/g;
  const oldWidgetRegex = /<Widget project="([\s\S]*?)">([\s\S]*?)<\/Widget>/g;
  const warningRegex = /<Warning type="NOT_IN_KNOWLEDGE_BASE" \/>/g;
  const plannerRegex = /<Planner type="([\s\S]*?)">([\s\S]*?)<\/Planner>/g;

  const parsedMessage = message;
  const thinking: string[] = [];
  const widgets: { project: string, summary: string, content: string, position: number }[] = [];
  const planners: { type: string, content: string, position: number }[] = [];
  let hasWarning = false;

  // 提取思考内容
  let thinkingMatch;
  while ((thinkingMatch = thinkingRegex.exec(message)) !== null) {
    thinking.push(thinkingMatch[1]);
  }

  // 提取planner内容
  let plannerMatch;
  while ((plannerMatch = plannerRegex.exec(message)) !== null) {
    planners.push({
      type: plannerMatch[1],
      content: plannerMatch[2],
      position: plannerMatch.index // 记录Planner在原始消息中的位置
    });
  }

  // 提取widget内容 - 新格式
  let widgetMatch;
  while ((widgetMatch = widgetRegex.exec(message)) !== null) {
    widgets.push({
      project: widgetMatch[1],
      summary: widgetMatch[2],
      content: widgetMatch[3],
      position: widgetMatch.index // 记录Widget在原始消息中的位置
    });
  }

  // 兼容旧格式
  let oldWidgetMatch;
  while ((oldWidgetMatch = oldWidgetRegex.exec(message)) !== null) {
    // 确保不重复处理已经匹配的新格式
    const isAlreadyMatched = widgets.some(w => w.content === oldWidgetMatch[2]);
    if (!isAlreadyMatched) {
      widgets.push({
        project: oldWidgetMatch[1],
        summary: oldWidgetMatch[1], // 使用project作为summary
        content: oldWidgetMatch[2],
        position: oldWidgetMatch.index // 记录Widget在原始消息中的位置
      });
    }
  }

  // 按位置排序widgets
  widgets.sort((a, b) => a.position - b.position);

  // 检查警告
  hasWarning = warningRegex.test(message);

  // 创建一个包含Widget占位符的消息
  let messageWithPlaceholders = parsedMessage;

  // 替换思考块、规划块和警告
  messageWithPlaceholders = messageWithPlaceholders
    .replace(thinkingRegex, '')
    .replace(plannerRegex, '')
    .replace(warningRegex, '')
    .trim();

  // 替换Widget为特殊占位符
  let placeholderIndex = 0;
  widgets.forEach(widget => {
    const widgetPattern = widget.summary ?
      new RegExp(`<Widget project="${escapeRegExp(widget.project)}" summary="${escapeRegExp(widget.summary)}">[\\s\\S]*?<\\/Widget>`) :
      new RegExp(`<Widget project="${escapeRegExp(widget.project)}">[\\s\\S]*?<\\/Widget>`);

    messageWithPlaceholders = messageWithPlaceholders.replace(
      widgetPattern,
      `__WIDGET_PLACEHOLDER_${placeholderIndex++}__`
    );
  });

  return {
    parsedMessage: messageWithPlaceholders,
    thinking,
    widgets,
    planners,
    hasWarning
  };
};

// 辅助函数：转义正则表达式中的特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
