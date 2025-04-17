// components/chat/AdminChatBox.tsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSignalR } from '@/hooks/useSignalR';
import { chatService, ChatRoom as ChatRoomType, ChatRoomStatus } from '@/services/chatService';
import ChatBubble from './ChatBubble';
import ChatRoom from './ChatRoom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X, Send, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getChatRoomStatusLabel = (status: ChatRoomStatus): string => {
  switch (status) {
    case ChatRoomStatus.Pending:
      return 'Đang chờ';
    case ChatRoomStatus.Success:
      return 'Đã trả lời';
    case ChatRoomStatus.Closed:
      return 'Đã đóng';
    default:
      return 'Không xác định';
  }
};

export default function AdminChatBox() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rooms, setRooms] = useState<ChatRoomType[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<ChatRoomStatus>(ChatRoomStatus.Pending);

  const {
    connected,
    error,
    messages,
    joinRoom,
    sendMessage,
    setInitialMessages,
    onNewRoom // Thêm onNewRoom
  } = useSignalR(user?.id || 0, user?.fullName || 'Admin');

  // Xử lý khi nhận được phòng mới
  useEffect(() => {
    const unsubscribe = onNewRoom((newRoom: ChatRoomType) => {
      if (newRoom.status === statusFilter) {
        setRooms(prev => [newRoom, ...prev]);
      }
    });

    return () => unsubscribe();
  }, [onNewRoom, statusFilter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [statusFilter, isOpen]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const fetchedRooms = await chatService.getRoomsByStatus(statusFilter);
      setRooms(fetchedRooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomSelect = async (roomId: number) => {
    setSelectedRoomId(roomId);
    await fetchMessages(roomId);
  };

  const handleStatusUpdate = async (newStatus: ChatRoomStatus) => {
    if (!selectedRoomId) return;
    
    setLoading(true);
    try {
      await chatService.updateRoomStatus(selectedRoomId, newStatus);
      await fetchRooms();
      if (newStatus === ChatRoomStatus.Closed) {
        setSelectedRoomId(null);
      }
    } catch (err) {
      console.error('Error updating room status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: number) => {
    setLoading(true);
    try {
      const messages = await chatService.getMessages(roomId);
      setInitialMessages(messages);
      await joinRoom(roomId);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRoomId) return;
    
    setLoading(true);
    try {
      await sendMessage(selectedRoomId, message.trim());
      setMessage('');
      const selectedRoom = rooms.find(room => room.id === selectedRoomId);
      if (selectedRoom?.status === ChatRoomStatus.Pending) {
        await handleStatusUpdate(ChatRoomStatus.Success);
      }
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

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-50"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[800px] bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-200 h-[600px]">
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Quản lý tin nhắn</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-3 border-b">
                <Select
                  value={statusFilter.toString()}
                  onValueChange={(value) => setStatusFilter(Number(value) as ChatRoomStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ChatRoomStatus)
                      .filter(value => !isNaN(Number(value)))
                      .map(status => (
                        <SelectItem key={status} value={status.toString()}>
                          {getChatRoomStatusLabel(status as ChatRoomStatus)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm phòng..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingRooms ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2">Đang tải...</span>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    {searchTerm ? 'Không tìm thấy phòng phù hợp' : 'Chưa có phòng chat nào'}
                  </div>
                ) : (
                  filteredRooms.map(room => (
                    <ChatRoom
                      key={room.id}
                      room={room}
                      isActive={selectedRoomId === room.id}
                      onClick={() => handleRoomSelect(room.id)}
                    />
                  ))
                )}
              </div>

              <div className="p-3 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={fetchRooms}
                  disabled={loadingRooms}
                >
                  {loadingRooms ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang tải...
                    </>
                  ) : (
                    'Làm mới danh sách'
                  )}
                </Button>
              </div>
            </div>

            <div className="w-2/3 flex flex-col">
              {selectedRoomId ? (
                <>
                  <div className="p-3 border-b bg-gray-50 flex gap-2">
                    <Button
                      variant="outline"
                      className="bg-green-500 text-white hover:bg-green-600"
                      onClick={() => handleStatusUpdate(ChatRoomStatus.Success)}
                      disabled={loading}
                    >
                      Đánh dấu đã trả lời
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-red-500 text-white hover:bg-red-600"
                      onClick={() => handleStatusUpdate(ChatRoomStatus.Closed)}
                      disabled={loading}
                    >
                      Đóng chat
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col-reverse">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-2">Đang tải tin nhắn...</span>
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

                  <div className="p-3 border-t">
                    <div className="flex items-end gap-2">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 resize-none min-h-[60px] max-h-[120px]"
                        disabled={loading || !connected}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || loading || !connected}
                        className="h-10 w-10 p-0"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Chọn một phòng chat để bắt đầu
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}