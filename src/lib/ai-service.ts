import { Message } from './db';

// API信息
const API_BASE_URL = 'https://bad-bear-67.deno.dev/api/v1/chat/completions';
const API_KEY = '7e499853ee776f7932ce20f84e7555281409a54b'; // 实际开发中这应该通过环境变量安全管理
const MODEL_NAME = 'openrouter/quasar-alpha';
const SYSTEM_PROMPT_FILE = 'system-prompt.txt';

// 从文件读取系统提示词
let SYSTEM_PROMPT = `
你是 FC
`;

// 自动从服务器加载系统提示词
const loadSystemPromptFromServer = async () => {
  try {
    const response = await fetch(`/${SYSTEM_PROMPT_FILE}`);
    if (response.ok) {
      const text = await response.text();
      SYSTEM_PROMPT = text;
      localStorage.setItem('system_prompt', text);
      console.log('已从服务器加载系统提示词');
      return true;
    } else {
      console.error('加载系统提示词失败:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('加载系统提示词失败:', error);
    return false;
  }
};

// 初始化时自动加载系统提示词
loadSystemPromptFromServer().catch(error => {
  console.error('自动加载系统提示词失败:', error);
  // 如果从服务器加载失败，尝试从本地存储加载
  try {
    const systemPromptFromFile = localStorage.getItem('system_prompt');
    if (systemPromptFromFile) {
      SYSTEM_PROMPT = systemPromptFromFile;
      console.log('已从本地存储加载系统提示词');
    }
  } catch (error) {
    console.error('从本地存储加载系统提示词失败:', error);
  }
});

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

// 从文件加载系统提示词
export const loadSystemPromptFromFile = async (fileContent: string) => {
  try {
    SYSTEM_PROMPT = fileContent;
    localStorage.setItem('system_prompt', fileContent);
    return true;
  } catch (error) {
    console.error('保存系统提示词失败:', error);
    return false;
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
    // 构建请求消息
    const requestMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // 创建新的AbortController
    currentController = new AbortController();
    const signal = currentController.signal;

    // 使用流式API
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: requestMessages,
        temperature: 0.45,
        max_tokens: 4096,
        stream: true // 启用流式响应
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

    // 如果是开发环境或没有reader，使用模拟数据
    

    // 处理真实流式响应
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
          if (data === '[DONE]') continue;
          
          try {
            const json = JSON.parse(data);
            const content = json.choices[0]?.delta?.content || '';
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
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "你是一个助手，请根据用户的第一条消息生成一个简短的会话标题（不超过20个字）。"
          },
          {
            role: "user",
            content: `根据这条消息生成一个简短的会话标题：${firstMessage}`
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      throw new Error(`生成标题API请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.replace(/["']/g, '').trim();
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

  const parsedMessage = message;
  const thinking: string[] = [];
  const widgets: { project: string, summary: string, content: string, position: number }[] = [];
  let hasWarning = false;

  // 提取思考内容
  let thinkingMatch;
  while ((thinkingMatch = thinkingRegex.exec(message)) !== null) {
    thinking.push(thinkingMatch[1]);
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
  
  // 替换思考块和警告
  messageWithPlaceholders = messageWithPlaceholders
    .replace(thinkingRegex, '')
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
    hasWarning
  };
};

// 辅助函数：转义正则表达式中的特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
