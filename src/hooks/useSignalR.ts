import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { ChatMessage, ChatRoom } from '@/services/chatService';

export function useSignalR(userId: number, userName: string) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTokenReady, setIsTokenReady] = useState(false);
  
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const newRoomCallbacks = useRef<((room: ChatRoom) => void)[]>([]);
  const newOrderCallbacks = useRef<((order: any) => void)[]>([]);
  const currentRoomRef = useRef<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('app_token');
    if (token) {
      setIsTokenReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isTokenReady) return;

    const getToken = () =>
      (localStorage.getItem('app_token') || '').replace(/^"|"$/g, '');

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:5000'}/chathub`, {
        accessTokenFactory: getToken
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveMessage', (message: ChatMessage) => {
      // ✅ Đảm bảo message có unique key
      const messageWithKey = {
        ...message,
        id: message.id || Date.now() + Math.random(), // Fallback unique ID
        key: `${message.id || Date.now()}-${message.senderId}-${message.createdAt}` // Unique key
      };
      
      setMessages(prev => {
        // ✅ Kiểm tra duplicate message
        const isDuplicate = prev.some(m => 
          m.id === messageWithKey.id && 
          m.content === messageWithKey.content &&
          m.senderId === messageWithKey.senderId &&
          m.createdAt === messageWithKey.createdAt
        );
        
        if (isDuplicate) {
          return prev; // Không thêm message duplicate
        }
        
        return [messageWithKey, ...prev];
      });
    });

    connection.on('ReceiveNewRoom', (room: ChatRoom) => {
      newRoomCallbacks.current.forEach(cb => cb(room));
    });

    connection.on('ReceiveNewOrder', (order: any) => {
      newOrderCallbacks.current.forEach(cb => cb(order));
    });

    connection.start()
      .then(() => {
        console.log('SignalR Connected');
        setConnected(true);
        setError(null);
        return connection.invoke('JoinAdminGroup');
      })
      .catch((err) => {
        console.error('SignalR Connection Error:', err);
        setError(`Lỗi kết nối: ${err.message}`);
        setConnected(false);
      });

    connection.onreconnected(() => {
      console.log('SignalR Reconnected');
      setConnected(true);
      setError(null);
    });

    connection.onclose(() => {
      console.log('SignalR Connection Closed');
      setConnected(false);
    });

    return () => {
      connection.stop();
      connection.off('ReceiveMessage');
      connection.off('ReceiveNewRoom');
      connection.off('ReceiveNewOrder');
    };
  }, [isTokenReady]);

  const onNewRoom = (callback: (room: ChatRoom) => void) => {
    newRoomCallbacks.current.push(callback);
    return () => {
      newRoomCallbacks.current = newRoomCallbacks.current.filter(cb => cb !== callback);
    };
  };

  const onNewOrder = (callback: (order: any) => void) => {
    newOrderCallbacks.current.push(callback);
    return () => {
      newOrderCallbacks.current = newOrderCallbacks.current.filter(cb => cb !== callback);
    };
  };

  const joinRoom = async (roomId: number) => {
    if (!connected || !connectionRef.current) {
      setError('Chưa kết nối đến máy chủ chat');
      return false;
    }

    // ✅ Kiểm tra nếu đã join room này rồi
    if (currentRoomRef.current === roomId) {
      console.log(`Already joined room ${roomId}`);
      return true;
    }

    try {
      await connectionRef.current.invoke('JoinRoom', roomId.toString());
      currentRoomRef.current = roomId; // ✅ Track current room
      console.log(`Joined room: ${roomId}`);
      return true;
    } catch (err: any) {
      console.error('Error joining room:', err);
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
      console.error('Error sending message:', err);
      setError(`Lỗi khi gửi tin nhắn: ${err.message}`);
      return false;
    }
  };

  const setInitialMessages = (initialMessages: ChatMessage[]) => {
    // ✅ Đảm bảo mỗi message có unique key
    const messagesWithKeys = initialMessages.map((msg, index) => ({
      ...msg,
      key: `initial-${msg.id || index}-${msg.senderId}-${msg.createdAt}`
    })).reverse();
    
    setMessages(messagesWithKeys);
    currentRoomRef.current = null; // Reset room tracking
  };

  const clearMessages = () => {
    setMessages([]);
    currentRoomRef.current = null; // Reset room tracking
  };

  return {
    connected,
    error,
    messages,
    joinRoom,
    sendMessage,
    setInitialMessages,
    clearMessages,
    onNewRoom,
    onNewOrder
  };
}