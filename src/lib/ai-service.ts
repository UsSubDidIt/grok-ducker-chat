
import { Message } from './db';

// 硬编码的API信息
const API_BASE_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = 'sk-dummy-key'; // 实际开发中这应该通过环境变量安全管理
const MODEL_NAME = 'gpt-4o';
const SYSTEM_PROMPT = `
你是 Co-Ducker，一个友好的中文AI助手。
当你思考时，请使用 <Thinking>你的思考内容</Thinking> 格式。
当你想展示代码窗口时，请使用 <Widget project="项目名称">代码内容</Widget> 格式。
当用户问的问题你的知识库中没有时，使用 <Warning type="NOT_IN_KNOWLEDGE_BASE" /> 标记。
`;

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 处理发送消息到AI
export const sendMessageToAI = async (
  messages: Message[], 
  onThinking?: (isThinking: boolean, time?: number) => void
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

    // 模拟AI响应延迟 (实际应用中会替换为真实API调用)
    // 在真实应用中使用以下代码:
    /*
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: requestMessages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
    */

    // 模拟响应，仅用于演示
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 随机选择一个响应模式
    const responseOptions = [
      '您好！我是Co-Ducker，很高兴为您服务。有什么我可以帮助您的吗？',
      '<Thinking>我需要分析这个问题，看看如何提供最佳回答。首先考虑用户可能的意图...</Thinking>\n\n根据您的问题，我理解您想了解更多关于React hooks的知识。React hooks是React 16.8引入的新特性，允许您在不编写类的情况下使用状态和其他React特性。',
      '这是一个关于JavaScript的问题。<Widget project="demo">const greeting = "你好，世界！";\nconsole.log(greeting);\n\n// 这是一个简单的JavaScript示例\nfunction add(a, b) {\n  return a + b;\n}\n\nconst result = add(5, 3);\nconsole.log(`结果是: ${result}`);</Widget>',
      '抱歉，我对这个问题没有足够的信息。<Warning type="NOT_IN_KNOWLEDGE_BASE" />'
    ];
    
    const randomResponse = responseOptions[Math.floor(Math.random() * responseOptions.length)];
    
    // 记录思考结束时间
    const thinkingTime = (Date.now() - thinkingStartTime) / 1000;
    onThinking?.(false, thinkingTime);
    
    return randomResponse;
  } catch (error) {
    console.error('AI请求失败:', error);
    onThinking?.(false);
    throw error;
  }
};

// 解析特殊标签
export const parseMessage = (message: string) => {
  const thinkingRegex = /<Thinking>([\s\S]*?)<\/Thinking>/g;
  const widgetRegex = /<Widget project="([\s\S]*?)">([\s\S]*?)<\/Widget>/g;
  const warningRegex = /<Warning type="NOT_IN_KNOWLEDGE_BASE" \/>/g;

  let parsedMessage = message;
  let thinking: string[] = [];
  let widgets: { project: string, content: string }[] = [];
  let hasWarning = false;

  // 提取思考内容
  let thinkingMatch;
  while ((thinkingMatch = thinkingRegex.exec(message)) !== null) {
    thinking.push(thinkingMatch[1]);
  }

  // 提取widget内容
  let widgetMatch;
  while ((widgetMatch = widgetRegex.exec(message)) !== null) {
    widgets.push({
      project: widgetMatch[1],
      content: widgetMatch[2]
    });
  }

  // 检查警告
  hasWarning = warningRegex.test(message);

  // 清理消息中的特殊标签
  parsedMessage = parsedMessage
    .replace(thinkingRegex, '')
    .replace(widgetRegex, '')
    .replace(warningRegex, '')
    .trim();

  return {
    parsedMessage,
    thinking,
    widgets,
    hasWarning
  };
};
