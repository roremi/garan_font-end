import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { ChatMessage, ChatRoom } from '@/services/chatService';

export function useSignalR(userId: number, userName: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isTokenReady, setIsTokenReady] = useState(false);

  // Callbacks
  const newRoomCallbacks = useRef<((room: ChatRoom) => void)[]>([]);
  const newOrderCallbacks = useRef<((order: any) => void)[]>([]);

  /** ✅ Kiểm tra token trước khi kết nối */
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

  /** ✅ Khởi tạo kết nối SignalR */
  useEffect(() => {
    if (!isTokenReady) return;

    const getToken = () =>
      (localStorage.getItem('app_token') || '').replace(/^"|"$/g, '');

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:1000'}/chathub`, {
      accessTokenFactory: getToken
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    /** ✅ Sự kiện SignalR */
    connection.on('ReceiveMessage', (message: ChatMessage) => {
      setMessages(prev => [message, ...prev]);
    });

    connection.on('ReceiveNewRoom', (room: ChatRoom) => {
      newRoomCallbacks.current.forEach(cb => cb(room));
    });

    connection.on('ReceiveNewOrder', (order: any) => {
      newOrderCallbacks.current.forEach(cb => cb(order));
    });

    /** ✅ Bắt đầu kết nối */
    const startConnection = async () => {
      try {
        await connection.start();
        console.log('✅ SignalR connected');
        setConnected(true);
        setError(null);

        await connection.invoke('JoinAdminGroup'); // Tham gia nhóm Admin
      } catch (err: any) {
        console.error('❌ SignalR Connection Error:', err);
        setError('Không thể kết nối đến máy chủ');
        setTimeout(startConnection, 5000); // Thử kết nối lại
      }
    };

    startConnection();

    /** ✅ Xử lý sự kiện reconnect */
    connection.onreconnecting(() => {
      console.warn('🔄 Reconnecting...');
      setConnected(false);
    });

    connection.onreconnected(() => {
      console.log('✅ Reconnected');
      setConnected(true);
    });

    connection.onclose(() => {
      console.warn('🔌 Connection closed');
      setConnected(false);
    });

    return () => {
      connection.stop();
      connection.off('ReceiveMessage');
      connection.off('ReceiveNewRoom');
      connection.off('ReceiveNewOrder');
    };
  }, [isTokenReady]);

  /** ✅ Đăng ký callback nhận phòng mới */
  const onNewRoom = (callback: (room: ChatRoom) => void) => {
    newRoomCallbacks.current.push(callback);
    return () => {
      newRoomCallbacks.current = newRoomCallbacks.current.filter(cb => cb !== callback);
    };
  };

  /** ✅ Đăng ký callback nhận đơn hàng mới */
  const onNewOrder = (callback: (order: any) => void) => {
    newOrderCallbacks.current.push(callback);
    return () => {
      newOrderCallbacks.current = newOrderCallbacks.current.filter(cb => cb !== callback);
    };
  };

  /** ✅ Tham gia phòng chat */
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
      console.error('Error joining room:', err);
      setError(`Lỗi khi tham gia phòng: ${err.message}`);
      return false;
    }
  };

  /** ✅ Gửi tin nhắn */
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
      console.error('Error sending message:', err);
      setError(`Lỗi khi gửi tin nhắn: ${err.message}`);
      return false;
    }
  };

  return {
    connected,
    error,
    messages,
    joinRoom,
    sendMessage,
    onNewRoom,
    onNewOrder
  };
}