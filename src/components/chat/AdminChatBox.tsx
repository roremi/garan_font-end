// components/chat/AdminChatBox.tsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSignalR } from '@/hooks/useSignalR';
import { chatService, ChatRoom as ChatRoomType } from '@/services/chatService';
import ChatBubble from './ChatBubble';
import ChatRoom from './ChatRoom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X, Send, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  
  const {
    connected,
    error,
    messages,
    joinRoom,
    sendMessage,
    setInitialMessages
  } = useSignalR(user?.id || 0, user?.fullName || 'Admin');

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lấy danh sách phòng khi mở chat box
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const fetchedRooms = await chatService.getRooms();
      setRooms(fetchedRooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Lấy tin nhắn của phòng
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

  const handleOpen = async () => {
    setIsOpen(true);
    await fetchRooms();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRoomSelect = async (roomId: number) => {
    setSelectedRoomId(roomId);
    await fetchMessages(roomId);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRoomId) return;
    
    setLoading(true);
    try {
      await sendMessage(selectedRoomId, message.trim());
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

  // Lọc phòng theo từ khóa tìm kiếm
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-50"
          aria-label="Open admin chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[800px] bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-200 h-[600px]">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Quản lý tin nhắn</h3>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Rooms List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm phòng chat..."
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
                    <span className="ml-2 text-gray-500">Đang tải...</span>
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

            {/* Chat Content */}
            <div className="w-2/3 flex flex-col">
              {selectedRoomId ? (
                <>
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col-reverse">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-500">Đang tải tin nhắn...</span>
                      </div>
                    ) : error ? (
                      <div className="text-center text-red-500 py-4">
                        {error}
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => selectedRoomId && fetchMessages(selectedRoomId)}
                        >
                          Thử lại
                        </Button>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-4">
                        Chưa có tin nhắn nào trong phòng này.
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
                    {!connected && !error && (
                      <div className="text-xs text-amber-500 mt-1">
                        Đang kết nối...
                      </div>
                    )}
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
