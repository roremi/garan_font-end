// components/chat/ChatRoom.tsx
import { useState } from 'react';
import { ChatRoom as ChatRoomType, ChatMessage , ChatRoomStatus } from '@/services/chatService';
import {formatDistanceToNow} from 'date-fns/formatDistanceToNow';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface ChatRoomProps {
  room: ChatRoomType;
  isActive: boolean;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  onClick: () => void;
}
const getStatusBadgeColor = (status: ChatRoomStatus) => {
  switch (status) {
    case ChatRoomStatus.Pending:
      return 'bg-yellow-500';
    case ChatRoomStatus.Success:
      return 'bg-green-500';
    case ChatRoomStatus.Closed:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};
export default function ChatRoom({ 
  room, 
  isActive, 
  lastMessage, 
  unreadCount = 0, 
  onClick 
}: ChatRoomProps) {
  return (
    <div
      className={`p-3 border-b cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-medium truncate">{room.name}</h3>
        {unreadCount > 0 && (
           <Badge className={`${getStatusBadgeColor(room.status)}`}>
           {room.status}
         </Badge>
        )}
      </div>
      <div className="text-xs text-gray-500">
        {room.departmentName}
      </div>
      {lastMessage && (
        <div className="mt-1">
          <p className="text-sm text-gray-600 truncate">{lastMessage.content}</p>
          <div className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(lastMessage.createdAt), { 
              addSuffix: true, 
              locale: vi 
            })}
          </div>
        </div>
      )}
    </div>
  );
  
  
}
