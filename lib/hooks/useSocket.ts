// hooks/useSocket.ts
import {type MutableRefObject, useEffect, useMemo, useRef, useState} from 'react';
import {io, Socket} from 'socket.io-client';
import debounce from "lodash.debounce";

type NotificationPayload = {
  id: string;
  content: string;
  decorators: {
    offset: number;
    length: number;
    type: 'bold' | 'italic' | 'underline' | 'color';
    color?: string;
  }[];
  createdAt: Date;
  isUpdated: boolean;
  isRead: boolean;
  type: string;
};

type InitSdkProps = {
  totalUnread: number;
  notis: NotificationPayload[];
}

export const useSocketSdk = ({
                               token,
                               url,
                               maxSize = 5
                             }: {
  token: string;
  url: string;
  maxSize: number;
}): {
  unread: number;
  notis: NotificationPayload[],
  socketRef: MutableRefObject<Socket | null>
  delNoti: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
} => {
  const [notis, setNotis] = useState<NotificationPayload[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);

  const delNoti = debounce((id: string) => {
    socketRef.current?.emit('del-noti', {id});
    setNotis((prev => prev?.filter(noti => noti.id !== id)));
  }, 1000)

  const markRead = debounce((id: string) => {
    socketRef.current?.emit('mark-read', {id});
    setNotis((prev => prev?.map(noti => noti.id === id ? {...noti, isRead: true} : noti)));
    setUnread(prev => prev > 0 ? prev - 1 : prev)
  }, 800)

  const markAllRead = debounce(() => {
    socketRef.current?.emit('mark-all-read');
    setNotis((prev => prev?.map(noti => ({...noti, isRead: true}))));
    setUnread(0)
  }, 800)

  useEffect(() => {
    if (!token) {
      console.warn('No token');
      return;
    }

    const socket = io(url, {
      query: {token, maxSize}, // 👈 truyền token JWT vào query
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('notification', (data: NotificationPayload) => {
      if (data) {
        if (data.isUpdated) {
          setNotis((prev) => prev?.map(e => e.id === data.id ? data : e))
        } else {
          setNotis((prev) => [data, ...prev.slice(0, maxSize > 1 ? maxSize - 1 : 1)]); // giữ tối đa 5 noti
          setUnread(prev => prev + 1)
        }
      }
    });

    socket.on('init', (data: InitSdkProps) => {
      if (data) {
        setNotis(data.notis);
        setUnread(data.totalUnread ?? 0)
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('❗ Socket connect error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return useMemo(() => ({
    notis,
    unread,
    socketRef,
    delNoti,
    markRead,
    markAllRead,
  }), [notis, socketRef, unread, delNoti, markRead, markAllRead]);
};
