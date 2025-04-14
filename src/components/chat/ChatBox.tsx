// components/chat/ChatBox.tsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSignalR } from '@/hooks/useSignalR';
import { chatService, ChatRoomStatus } from '@/services/chatService';
import ChatBubble from './ChatBubble';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X, Send, Loader2, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ChatBox() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [showClosedRoomDialog, setShowClosedRoomDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    connected,
    error,
    messages,
    joinRoom,
    sendMessage,
    setInitialMessages
  } = useSignalR(user?.id || 0, user?.fullName || 'Khách');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewRoom = async () => {
    if (!user) return;
    
    setInitializing(true);
    try {
      const newRoom = await chatService.createRoom({
        name: user.fullName,
        departmentName: 'Hỗ trợ khách hàng'
      });
      
      setRoomId(newRoom.id);
      setInitialMessages([]);
      await joinRoom(newRoom.id);
      setShowClosedRoomDialog(false);
    } catch (err) {
      console.error('Error creating new room:', err);
    } finally {
      setInitializing(false);
    }
  };

  const initializeChat = async () => {
    if (!user) return;
    
    setInitializing(true);
    try {
      const rooms = await chatService.getRooms();
      // Tìm phòng chat mới nhất của người dùng
      const userRooms = rooms
        .filter(room => room.name === user.fullName)
        .sort((a, b) => b.id - a.id); // Sắp xếp theo ID giảm dần
      
      const latestRoom = userRooms[0];
      
      if (latestRoom) {
        // Kiểm tra trạng thái phòng
        if (latestRoom.status === ChatRoomStatus.Closed) {
          setShowClosedRoomDialog(true);
          return;
        }
        
        setRoomId(latestRoom.id);
        const chatMessages = await chatService.getMessages(latestRoom.id);
        setInitialMessages(chatMessages);
        await joinRoom(latestRoom.id);
      } else {
        // Nếu chưa có phòng nào, tạo phòng mới
        await createNewRoom();
      }
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
    } else {
      // Kiểm tra trạng thái phòng hiện tại khi mở lại chat
      try {
        const currentRoom = await chatService.getRooms()
          .then(rooms => rooms.find(r => r.id === roomId));
        
        if (currentRoom?.status === ChatRoomStatus.Closed) {
          setShowClosedRoomDialog(true);
        }
      } catch (err) {
        console.error('Error checking room status:', err);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !roomId) return;
    
    setLoading(true);
    try {
      const room = await chatService.getRooms()
        .then(rooms => rooms.find(r => r.id === roomId));
      
      if (room?.status === ChatRoomStatus.Closed) {
        setShowClosedRoomDialog(true);
        return;
      }
      
      await sendMessage(roomId, message.trim());
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <AlertDialog open={showClosedRoomDialog} onOpenChange={setShowClosedRoomDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Phòng chat đã được đóng</AlertDialogTitle>
            <AlertDialogDescription>
              Phòng chat này đã kết thúc. Bạn có muốn tạo cuộc trò chuyện mới không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowClosedRoomDialog(false);
              setIsOpen(false);
            }}>
              Không
            </AlertDialogCancel>
            <AlertDialogAction onClick={createNewRoom}>
              Tạo cuộc trò chuyện mới
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center gap-2"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
          <span className="hidden sm:inline">Chat với chúng tôi</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] md:w-[450px] lg:w-[500px] bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-medium text-lg">Hỗ trợ khách hàng</h3>
              <p className="text-sm text-blue-100">
                {connected ? 'Đang kết nối' : 'Đang kết nối...'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-blue-700 rounded-full"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-[400px] max-h-[600px] flex flex-col-reverse">
            {initializing ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600">Đang khởi tạo chat...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-6 flex flex-col items-center">
                <AlertCircle className="h-12 w-12 mb-3" />
                <p className="mb-3">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={initializeChat}
                >
                  Thử kết nối lại
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg">Chào mừng bạn!</p>
                <p className="text-sm">Hãy bắt đầu cuộc trò chuyện với chúng tôi.</p>
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
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex items-end gap-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn của bạn..."
                className="flex-1 resize-none min-h-[60px] max-h-[120px] focus:ring-blue-500"
                disabled={loading || !connected || initializing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || loading || !connected || initializing}
                className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            {!connected && !error && (
              <div className="flex items-center gap-2 text-sm text-amber-500 mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang kết nối với máy chủ...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
