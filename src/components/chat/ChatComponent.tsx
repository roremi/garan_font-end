// components/chat/ChatComponent.tsx
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import động để tránh lỗi hydration
const ChatBox = dynamic(() => import('@/components/chat/ChatBox'), { ssr: false });
const AdminChatBox = dynamic(() => import('@/components/chat/AdminChatBox'), { ssr: false });

export default function ChatComponent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Đảm bảo component chỉ render ở client-side
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || isLoading || !isAuthenticated || !user) return null;
  
  // Kiểm tra role của người dùng để hiển thị chat box phù hợp
  const isAdmin = user.role === 0 || user.role === 2;
  
  return isAdmin ? <AdminChatBox /> : <ChatBox />;
}
