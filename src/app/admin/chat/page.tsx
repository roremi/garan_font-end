// admin/chat/page.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSignalR } from '@/hooks/useSignalR';
import { chatService, ChatRoom as ChatRoomType, ChatRoomStatus } from '@/services/chatService';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatRoom from '@/components/chat/ChatRoom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Search, Loader2, LayoutDashboard, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const getChatRoomStatusColor = (status: ChatRoomStatus): string => {
  switch (status) {
    case ChatRoomStatus.Pending:
      return 'text-yellow-500';
    case ChatRoomStatus.Success:
      return 'text-green-500';
    case ChatRoomStatus.Closed:
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export default function ChatManagement() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [rooms, setRooms] = useState<ChatRoomType[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChatRoomStatus>(ChatRoomStatus.Pending);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    success: 0,
    closed: 0
  });

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
      // Chỉ thêm phòng nếu phù hợp với statusFilter hiện tại
      if (newRoom.status === statusFilter) {
        setRooms(prev => [newRoom, ...prev]);
      }
      // Cập nhật thống kê
      setStats(prev => ({
        total: prev.total + 1,
        pending: prev.pending + (newRoom.status === ChatRoomStatus.Pending ? 1 : 0),
        success: prev.success + (newRoom.status === ChatRoomStatus.Success ? 1 : 0),
        closed: prev.closed + (newRoom.status === ChatRoomStatus.Closed ? 1 : 0)
      }));
    });

    return () => unsubscribe();
  }, [onNewRoom, statusFilter]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  useEffect(() => {
    if (selectedRoomId) {
      const timeoutId = setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    fetchRooms();
  }, [statusFilter]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const fetchedRooms = await chatService.getRoomsByStatus(statusFilter);
      setRooms(fetchedRooms);
      
      const allRooms = await chatService.getRooms();
      setStats({
        total: allRooms.length,
        pending: allRooms.filter(r => r.status === ChatRoomStatus.Pending).length,
        success: allRooms.filter(r => r.status === ChatRoomStatus.Success).length,
        closed: allRooms.filter(r => r.status === ChatRoomStatus.Closed).length
      });
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
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Chat</h1>
            <p className="text-gray-500">Quản lý và phản hồi tin nhắn từ khách hàng</p>
          </div>
          <Button
            onClick={() => fetchRooms()}
            disabled={loadingRooms}
            variant="outline"
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
              <CardDescription>Tổng số phòng</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-yellow-500">{stats.pending}</CardTitle>
              <CardDescription>Đang chờ</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-green-500">{stats.success}</CardTitle>
              <CardDescription>Đã trả lời</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-red-500">{stats.closed}</CardTitle>
              <CardDescription>Đã đóng</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Danh sách phòng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select
                    value={statusFilter.toString()}
                    onValueChange={(value) => setStatusFilter(Number(value) as ChatRoomStatus)}
                  >
                    <SelectTrigger>
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

                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm phòng..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="h-[calc(100vh-400px)] overflow-y-auto border rounded-lg">
                    {loadingRooms ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    ) : filteredRooms.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
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
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 md:col-span-8 lg:col-span-9">
            <Card className="h-[calc(100vh-200px)]">
              {selectedRoomId ? (
                <div className="h-full flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          {rooms.find(r => r.id === selectedRoomId)?.name}
                        </CardTitle>
                        <CardDescription>
                          {rooms.find(r => r.id === selectedRoomId)?.departmentName}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                className="bg-green-500 text-white hover:bg-green-600"
                                onClick={() => handleStatusUpdate(ChatRoomStatus.Success)}
                                disabled={loading}
                              >
                                Đánh dấu đã trả lời
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Đánh dấu phòng chat này đã được trả lời</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                className="bg-red-500 text-white hover:bg-red-600"
                                onClick={() => handleStatusUpdate(ChatRoomStatus.Closed)}
                                disabled={loading}
                              >
                                Đóng chat
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Đóng phòng chat này</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-2">Đang tải tin nhắn...</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {[...messages].reverse().map((msg) => (
                          <ChatBubble key={msg.id} message={msg} />
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </CardContent>

                  <div className="p-4 border-t">
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
                          <MessageCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {!connected && (
                      <p className="text-sm text-amber-500 mt-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang kết nối với máy chủ...
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <LayoutDashboard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Chưa có phòng chat nào được chọn</h3>
                    <p className="text-sm text-gray-400">
                      Chọn một phòng chat từ danh sách bên trái để bắt đầu
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}