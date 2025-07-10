import { useEffect, useRef, useState } from 'react';

export function useBlinkTitleOnUnread(unread: number, baseTitle: string) {
    const previousUnreadRef = useRef(unread);
    const [blinkStep, setBlinkStep] = useState(0);
    const [isBlinking, setIsBlinking] = useState(false);

    useEffect(() => {
        const previousUnread = previousUnreadRef.current;

        // Nếu unread mới > trước đó, kích hoạt chớp
        if (unread > previousUnread) {
            previousUnreadRef.current = unread;
            setIsBlinking(true);
        } else if (unread !== previousUnread) {
            previousUnreadRef.current = unread; // chỉ cập nhật nếu khác
        }
    }, [unread]);

    // Blink logic
    useEffect(() => {
        if (!isBlinking) return;

        let step = 0;
        const interval = setInterval(() => {
            setBlinkStep(s => s + 1);
            step++;
            if (step >= 10) {
                clearInterval(interval);
                setBlinkStep(0);
                setIsBlinking(false);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isBlinking]);

    // Cập nhật document.title
    useEffect(() => {
        if (blinkStep % 2 === 1) {
            document.title = `(${unread}) ${baseTitle}`;
        } else {
            document.title = baseTitle;
        }
    }, [blinkStep, unread, baseTitle]);
}
