import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { Model } from '../models/route';

// 从模型API获取模型信息
async function getModelInfo(modelId: string) {
  try {
    // 这里我们直接从模型列表中获取，实际应用中可能需要从数据库或API获取
    const modelsPath = path.join(process.cwd(), 'app/api/models/route.ts');
    const modelsContent = fs.readFileSync(modelsPath, 'utf-8');

    // 提取AVAILABLE_MODELS数组
    const modelsMatch = modelsContent.match(/const AVAILABLE_MODELS: Model\[\] = (\[\s*\{[\s\S]*?\}\s*\]);/);
    if (!modelsMatch) {
      throw new Error('无法解析模型列表');
    }

    // 使用eval解析模型列表（注意：这种方法在生产环境中不安全，仅用于演示）
    // 实际应用中应该使用数据库或专门的配置文件
    const models = eval(modelsMatch[1]);
    const model = models.find((m: Model) => m.id === modelId);

    if (!model) {
      // 如果找不到指定模型，使用默认模型
      return {
        apiEndpoint: 'https://bad-bear-67.deno.dev/api/v1/chat/completions',
        apiKey: '7e499853ee776f7932ce20f84e7555281409a54b',
        modelId: 'openrouter/quasar-alpha',
        systemPromptPath: 'app/api/chat/system-prompt.txt' // 默认系统提示词文件路径
      };
    }

    return {
      apiEndpoint: model.apiEndpoint,
      apiKey: model.apiKey,
      modelId: model.id,
      systemPromptPath: model.systemPromptPath || 'app/api/chat/system-prompt.txt' // 如果模型没有指定系统提示词路径，使用默认路径
    };
  } catch (error) {
    console.error('获取模型信息失败:', error);
    // 返回默认值
    return {
      apiEndpoint: 'https://bad-bear-67.deno.dev/api/v1/chat/completions',
      apiKey: '7e499853ee776f7932ce20f84e7555281409a54b',
      modelId: 'openrouter/quasar-alpha',
      systemPromptPath: 'app/api/chat/system-prompt.txt' // 默认系统提示词文件路径
    };
  }
}

// 获取系统提示词
const getSystemPrompt = (modelInfo: { systemPromptPath?: string }): string => {
  try {
    // 如果模型信息中包含系统提示词路径，则从该路径读取系统提示词
    if (modelInfo.systemPromptPath) {
      const promptPath = path.join(process.cwd(), modelInfo.systemPromptPath);
      return fs.readFileSync(promptPath, 'utf-8');
    } else {
      // 如果模型没有特定的系统提示词路径，则尝试从默认文件中读取系统提示词
      const defaultPromptPath = path.join(process.cwd(), 'app/api/chat/system-prompt.txt');
      return fs.readFileSync(defaultPromptPath, 'utf-8');
    }
  } catch (error) {
    console.error('读取系统提示文件失败:', error, '路径:', modelInfo.systemPromptPath);
    // 如果读取失败，返回默认提示词
    return '你是 FC';
  }
};

// 自定义请求格式，不兼容 OpenAI
interface ChatRequest {
  messages: {
    sender: string;  // 'user' 或 'assistant'，不使用 OpenAI 的 'role'
    text: string;    // 不使用 OpenAI 的 'content'
    timestamp?: number;
  }[];
  settings?: {
    temperature?: number;
    max_length?: number;  // 不使用 OpenAI 的 'max_tokens'
  };
  stream?: boolean;
  modelId?: string;  // 添加模型ID字段
}

// 处理流式响应
async function handleStreamResponse(response: Response) {
  const reader = response.body?.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (!reader) {
    return NextResponse.json({ error: '无法读取响应流' }, { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';

      try {
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
              if (data === '[DONE]') {
                // 发送自定义完成标记
                controller.enqueue(encoder.encode(`data: [COMPLETE]\n\n`));
                continue;
              }

              try {
                // 解析OpenAI格式的响应
                const json = JSON.parse(data);
                const content = json.choices[0]?.delta?.content || '';

                // 转换为自定义格式
                if (content) {
                  const customFormat = {
                    id: uuidv4(),
                    chunk: content,
                    timestamp: Date.now()
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(customFormat)}\n\n`));
                }
              } catch (e) {
                console.error('解析流式响应失败:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('流处理错误:', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// 处理常规响应
async function handleRegularResponse(response: Response) {
  try {
    const data = await response.json();

    // 转换为自定义格式
    const customResponse = {
      id: uuidv4(),
      created: Date.now(),
      result: {
        text: data.choices[0]?.message?.content || '',
        finish_reason: data.choices[0]?.finish_reason || 'stop'
      },
      usage: {
        prompt_chars: data.usage?.prompt_tokens || 0,
        completion_chars: data.usage?.completion_tokens || 0,
        total_chars: data.usage?.total_tokens || 0
      }
    };

    return NextResponse.json(customResponse);
  } catch (error) {
    console.error('处理响应失败:', error);
    return NextResponse.json({ error: '处理响应失败' }, { status: 500 });
  }
}

// 生成会话标题
export async function POST(req: NextRequest) {
  try {
    const requestData: ChatRequest = await req.json();

    // 验证请求格式
    if (!requestData.messages || !Array.isArray(requestData.messages)) {
      return NextResponse.json({ error: '无效的请求格式' }, { status: 400 });
    }

    // 获取模型信息
    const modelInfo = await getModelInfo(requestData.modelId || 'openrouter/quasar-alpha');

    // 获取系统提示词
    const systemPrompt = getSystemPrompt(modelInfo);

    // 转换为OpenAI格式 (仅用于与现有API通信)
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...requestData.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    ];

    // 构建请求体
    const requestBody = {
      model: modelInfo.modelId,
      messages: openaiMessages,
      temperature: requestData.settings?.temperature || 0.45,
      max_tokens: requestData.settings?.max_length || 4096,
      stream: requestData.stream || false
    };

    // 发送请求到AI服务
    const response = await fetch(modelInfo.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modelInfo.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败:', response.status, errorText);
      return NextResponse.json({ error: `API请求失败: ${response.status}` }, { status: response.status });
    }

    // 处理流式或常规响应
    if (requestData.stream) {
      return handleStreamResponse(response);
    } else {
      return handleRegularResponse(response);
    }

  } catch (error) {
    console.error('处理请求失败:', error);
    return NextResponse.json({ error: '处理请求失败' }, { status: 500 });
  }
}

// 生成会话标题的API端点
export async function PUT(req: NextRequest) {
  try {
    const { message, modelId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: '缺少消息内容' }, { status: 400 });
    }

    // 获取模型信息
    const modelInfo = await getModelInfo(modelId || 'openrouter/quasar-alpha');

    const response = await fetch(modelInfo.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modelInfo.apiKey}`
      },
      body: JSON.stringify({
        model: modelInfo.modelId,
        messages: [
          {
            role: "system",
            content: "你是一个助手，请根据用户的第一条消息生成一个简短的会话标题（不超过20个字）。"
            // 注意：这里使用固定的系统提示，因为这是专门用于生成标题的功能
          },
          {
            role: "user",
            content: `根据这条消息生成一个简短的会话标题：${message}`
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: `生成标题API请求失败: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const title = data.choices[0]?.message?.content?.trim() || '新对话';

    return NextResponse.json({ title });

  } catch (error) {
    console.error('生成标题失败:', error);
    return NextResponse.json({ error: '生成标题失败' }, { status: 500 });
  }
}
