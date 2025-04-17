// hooks/useSignalR.ts
import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { ChatMessage, ChatRoom } from '@/services/chatService';

export function useSignalR(userId: number, userName: string) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isTokenReady, setIsTokenReady] = useState(false);

  // Callback để xử lý phòng mới
  const newRoomCallbacks = useRef<((room: ChatRoom) => void)[]>([]);

  // Kiểm tra token
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('app_token');
      if (token) {
        setIsTokenReady(true);
      } else {
        setTimeout(checkToken, 500);
      }
    };
    
    checkToken();
  }, []);

  // Khởi tạo kết nối SignalR
  useEffect(() => {
    if (!isTokenReady) return;

    const getToken = () => {
      const token = localStorage.getItem('app_token') || '';
      return token.replace(/^"|"$/g, '');
    };

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/chatHub', {
        accessTokenFactory: getToken
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = newConnection;
    setConnection(newConnection);

    // Xử lý nhận tin nhắn
    newConnection.on('ReceiveMessage', (message: ChatMessage) => {
      setMessages(prev => [message, ...prev]);
    });

    // Xử lý nhận phòng mới
    newConnection.on('ReceiveNewRoom', (room: ChatRoom) => {
      newRoomCallbacks.current.forEach(callback => callback(room));
    });

    const startConnection = async () => {
      try {
        await newConnection.start();
        console.log('SignalR Connected');
        setConnected(true);
        setError(null);

        // Tham gia nhóm Admins nếu là admin/staff
        await newConnection.invoke('JoinAdminGroup');
      } catch (err: any) {
        console.error('SignalR Connection Error: ', err);
        setError('Không thể kết nối đến máy chủ chat');
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    newConnection.onreconnecting(error => {
      console.log('Đang kết nối lại SignalR...', error);
      setConnected(false);
    });

    newConnection.onreconnected(connectionId => {
      console.log('Đã kết nối lại SignalR', connectionId);
      setConnected(true);
    });

    newConnection.onclose(error => {
      console.log('Kết nối SignalR đã đóng', error);
      setConnected(false);
    });

    return () => {
      if (connectionRef.current) {
        connectionRef.current.off('ReceiveMessage');
        connectionRef.current.off('ReceiveNewRoom');
        connectionRef.current.stop();
      }
    };
  }, [isTokenReady]);

  // Hàm để đăng ký callback nhận phòng mới
  const onNewRoom = (callback: (room: ChatRoom) => void) => {
    newRoomCallbacks.current.push(callback);
    return () => {
      newRoomCallbacks.current = newRoomCallbacks.current.filter(cb => cb !== callback);
    };
  };

  const joinRoom = async (roomId: number) => {
    if (!connected || !connectionRef.current) {
      setError('Chưa kết nối đến máy chủ chat');
      return false;
    }

    try {
      await connectionRef.current.invoke('JoinRoom', roomId.toString());
      console.log(`Joined room: ${roomId}`);
      return true;
    } catch (err: any) {
      console.error('Error joining room: ', err);
      setError(`Lỗi khi tham gia phòng: ${err.message}`);
      return false;
    }
  };

  const sendMessage = async (roomId: number, message: string) => {
    if (!connected || !connectionRef.current) {
      setError('Chưa kết nối đến máy chủ chat');
      return false;
    }

    try {
      await connectionRef.current.invoke('SendMessage', roomId, message, userId, userName);
      console.log('Message sent');
      return true;
    } catch (err: any) {
      console.error('Error sending message: ', err);
      setError(`Lỗi khi gửi tin nhắn: ${err.message}`);
      return false;
    }
  };

  const setInitialMessages = (initialMessages: ChatMessage[]) => {
    setMessages(initialMessages);
  };

  return {
    connected,
    error,
    messages,
    joinRoom,
    sendMessage,
    setInitialMessages,
    onNewRoom // Xuất callback để component sử dụng
  };
}