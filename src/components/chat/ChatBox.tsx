// components/chat/ChatBox.tsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSignalR } from '@/hooks/useSignalR';
import { chatService } from '@/services/chatService';
import ChatBubble from './ChatBubble';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

export default function ChatBox() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    connected,
    error,
    messages,
    joinRoom,
    sendMessage,
    setInitialMessages
  } = useSignalR(user?.id || 0, user?.fullName || 'Khách');

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat when opened
  const initializeChat = async () => {
    if (!user) return;
    
    setInitializing(true);
    try {
      // Kiểm tra xem người dùng đã có phòng chat chưa
      const rooms = await chatService.getRooms();
      const userRoom = rooms.find(room => room.name === user.fullName);
      
      let currentRoomId: number;
      
      if (userRoom) {
        // Nếu đã có phòng
        currentRoomId = userRoom.id;
      } else {
        // Nếu chưa có phòng, tạo phòng mới
        const newRoom = await chatService.createRoom({
          name: user.fullName,
          departmentName: 'Hỗ trợ khách hàng'
        });
        currentRoomId = newRoom.id;
      }
      
      // Lưu roomId
      setRoomId(currentRoomId);
      
      // Lấy tin nhắn của phòng
      const chatMessages = await chatService.getMessages(currentRoomId);
      setInitialMessages(chatMessages);
      
      // Tham gia phòng chat qua SignalR
      await joinRoom(currentRoomId);
    } catch (err) {
      console.error('Error initializing chat:', err);
    } finally {
      setInitializing(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    if (!roomId) {
      await initializeChat();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !roomId) return;
    
    setLoading(true);
    try {
      await sendMessage(roomId, message.trim());
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi nhấn Enter để gửi tin nhắn
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-50"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-200 max-h-[500px]">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Hỗ trợ khách hàng</h3>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col-reverse">
            {initializing ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">
                {error}
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={initializeChat}
                >
                  Thử lại
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            ) : (
              <>
                <div ref={messagesEndRef} />
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-end gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 resize-none min-h-[60px] max-h-[120px]"
                disabled={loading || !connected || initializing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || loading || !connected || initializing}
                className="h-10 w-10 p-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!connected && !error && (
              <div className="text-xs text-amber-500 mt-1">
                Đang kết nối...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
