
// IndexedDB 数据库操作
const DB_NAME = 'co-ducker-db';
const DB_VERSION = 1;
const CONVERSATIONS_STORE = 'conversations';
const MESSAGES_STORE = 'messages';

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  lastUpdated: number;
  createdAt: number;
}

// 打开数据库连接
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('数据库打开失败', event);
      reject('数据库打开失败');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // 创建会话存储
      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        const conversationsStore = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
        conversationsStore.createIndex('by_lastUpdated', 'lastUpdated', { unique: false });
      }
      
      // 创建消息存储
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        messagesStore.createIndex('by_conversationId', 'conversationId', { unique: false });
        messagesStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// 保存消息
export const saveMessage = async (message: Message): Promise<string> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MESSAGES_STORE, 'readwrite');
    const store = transaction.objectStore(MESSAGES_STORE);
    const request = store.add(message);
    
    request.onsuccess = () => {
      resolve(message.id);
    };
    
    request.onerror = () => {
      reject('保存消息失败');
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 获取会话消息列表
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MESSAGES_STORE, 'readonly');
    const store = transaction.objectStore(MESSAGES_STORE);
    const index = store.index('by_conversationId');
    const request = index.getAll(IDBKeyRange.only(conversationId));
    
    request.onsuccess = () => {
      // 按时间戳排序
      const messages = request.result.sort((a, b) => a.timestamp - b.timestamp);
      resolve(messages);
    };
    
    request.onerror = () => {
      reject('获取消息失败');
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 保存会话
export const saveConversation = async (conversation: Conversation): Promise<string> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONVERSATIONS_STORE, 'readwrite');
    const store = transaction.objectStore(CONVERSATIONS_STORE);
    const request = store.put(conversation);
    
    request.onsuccess = () => {
      resolve(conversation.id);
    };
    
    request.onerror = () => {
      reject('保存会话失败');
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 获取所有会话
export const getAllConversations = async (): Promise<Conversation[]> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CONVERSATIONS_STORE, 'readonly');
    const store = transaction.objectStore(CONVERSATIONS_STORE);
    const index = store.index('by_lastUpdated');
    const request = index.getAll();
    
    request.onsuccess = () => {
      // 按最后更新时间倒序排列
      const conversations = request.result.sort((a, b) => b.lastUpdated - a.lastUpdated);
      resolve(conversations);
    };
    
    request.onerror = () => {
      reject('获取会话失败');
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// 删除会话及其消息
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONVERSATIONS_STORE, MESSAGES_STORE], 'readwrite');
    
    // 删除会话
    const conversationsStore = transaction.objectStore(CONVERSATIONS_STORE);
    conversationsStore.delete(conversationId);
    
    // 删除会话中的所有消息
    const messagesStore = transaction.objectStore(MESSAGES_STORE);
    const index = messagesStore.index('by_conversationId');
    const request = index.openCursor(IDBKeyRange.only(conversationId));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    
    transaction.onerror = () => {
      reject('删除会话失败');
    };
  });
};

// 导出类型
export type { Message, Conversation };
