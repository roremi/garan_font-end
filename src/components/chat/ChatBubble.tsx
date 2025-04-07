// components/chat/ChatBubble.tsx
import { ChatMessage } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import {formatDistanceToNow} from 'date-fns/formatDistanceToNow';
import { vi } from 'date-fns/locale';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const { user } = useAuth();
  const isOwnMessage = user?.id === message.senderId;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwnMessage 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        {!isOwnMessage && (
          <div className="font-semibold text-xs mb-1">{message.senderName}</div>
        )}
        <p className="text-sm">{message.content}</p>
        <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
          {formatDistanceToNow(new Date(message.createdAt), { 
            addSuffix: true,
            locale: vi 
          })}
        </div>
      </div>
    </div>
  );
}
