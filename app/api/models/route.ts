import { NextResponse } from 'next/server';

// 定义模型接口
export interface Model {
  id: string;
  name: string;
  description: string;
  provider: string;
  contextLength: number;
  apiEndpoint?: string;
  apiKey?: string;
  systemPromptPath?: string;  // 系统提示词文件路径
}

// 可用模型列表
const AVAILABLE_MODELS: Model[] = [
  {
    id: 'openrouter/quasar-alpha',
    name: 'Shine 3.2',
    description: '强大的通用模型，适合各种任务',
    provider: 'Sphera',
    contextLength: 16000,
    apiEndpoint: 'https://bad-bear-67.deno.dev/api/v1/chat/completions',
    apiKey: '7e499853ee776f7932ce20f84e7555281409a54b',
    systemPromptPath: 'app/api/chat/prompts/basic.txt'
  },
  {
    id: 'deepseek-ai/DeepSeek-V3',
    name: 'Shine Turbo',
    description: '强大的编码模型, 擅长编码任务',
    provider: 'Sphera',
    contextLength: 32000,
    apiEndpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    apiKey: 'sk-uxrkwngogbxsncxhwvtosnfetqplxmnismbkdiywwkpppgtl',
    systemPromptPath: 'app/api/chat/prompts/base.txt'
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Shine Pro',
    description: '最强大的编码模型, 擅长复杂任务, 具有规划能力',
    provider: 'Anthropic',
    contextLength: 32000,
    apiEndpoint: 'https://linuxdo.fufuidc.com/v1/chat/completions',
    apiKey: 'sk-OcTI7hFdmeTOkjQgnOUIuCKUxNjkZI0pSdhw3e56xdKndnY0',
    systemPromptPath: 'app/api/chat/prompts/pro.txt'
  }
];

// 获取模型列表的API端点
export async function GET() {
  try {
    // 返回公开信息，不包含API密钥、端点和系统提示词
    const publicModels = AVAILABLE_MODELS.map(({ id, name, description, provider, contextLength }) => ({
      id,
      name,
      description,
      provider,
      contextLength
    }));
    
    return NextResponse.json(publicModels);
  } catch (error) {
    console.error('获取模型列表失败:', error);
    return NextResponse.json({ error: '获取模型列表失败' }, { status: 500 });
  }
}
