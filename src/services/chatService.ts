// services/chatService.ts
const API_BASE_URL = 'http://localhost:5000/api';

export interface ChatRoom {
  id: number;
  name: string;
  departmentName: string;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  chatRoomId: number;
  createdAt: string;
}

// Hàm xử lý token để loại bỏ dấu ngoặc kép
const getToken = (): string => {
  const token = localStorage.getItem('app_token') || '';
  // Loại bỏ dấu ngoặc kép ở đầu và cuối nếu có
  return token.replace(/^"|"$/g, '');
};

export const chatService = {
  // Lấy danh sách phòng
  async getRooms(): Promise<ChatRoom[]> {
    const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    return response.json();
  },

  // Tạo phòng mới
  async createRoom(room: Partial<ChatRoom>): Promise<ChatRoom> {
    const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(room)
    });
    if (!response.ok) {
      throw new Error('Failed to create room');
    }
    return response.json();
  },

  // Lấy tin nhắn của phòng
  async getMessages(roomId: number): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE_URL}/chat/messages/${roomId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    return response.json();
  }
};
