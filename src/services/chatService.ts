// services/chatService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export enum ChatRoomStatus {
  Pending = 0,
  Success = 1,
  Closed = 2
}

export interface ChatRoom {
  id: number;
  name: string;
  departmentName: string;
  createdAt: string;
  status: ChatRoomStatus;
} 

export interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  chatRoomId: number;
  createdAt: string;
  key?: string;
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
  //lấy danh sách phòng theo trạng thái 
  async getRoomsByStatus(status: ChatRoomStatus): Promise<ChatRoom[]> {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/status/${status}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch rooms by status');
    }
    return response.json();
  },
  // Cập nhật trạng thái phòng
  updateRoomStatus: async (roomId: number, status: ChatRoomStatus) => {
    const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status })
      
    });
    if (!response.ok) {
      throw new Error('Failed to update room status');
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
