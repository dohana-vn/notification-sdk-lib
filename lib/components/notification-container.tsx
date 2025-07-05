import styles from './container.module.css'
import {LucideBellRing, LucideCheck, LucideX} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "./popover.tsx";
import {useSocketSdk} from "../hooks/useSocket.ts";
import {formatCreatedAt} from "../utils";
import {AnimatePresence, motion} from 'framer-motion';

interface NotificationContainerProps {
  token: string;
  url: string;
  transports?: string[];
  maxSize?: number;
  iconSize?: number;
  iconClassName?: string;
  badgeClassName?: string;
  containerClassName?: string;
}

export default function NotificationContainer(props: NotificationContainerProps): JSX.Element {
  const {notis, unread, delNoti, markRead, markAllRead} = useSocketSdk({
    token: props.token,
    url: props.url ?? 'http://localhost:7106',
    maxSize: props.maxSize ?? 5,
  })

  const navigate = (url: string) => {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const getTypeColor = (type = "info") => {
    const colors = {
      info: "#3b82f6",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    }
    return colors[type as keyof typeof colors] || colors.info
  }

  return (
    <Popover>
      <PopoverTrigger asChild={true}>
        <div className={`${styles.container} ${props.containerClassName ?? ''}`}>
          <div className={styles.icon}>
            <LucideBellRing className={props.iconClassName ?? ''} size={props.iconSize ?? 18} color={"black"}/>
            <div>
              <AnimatePresence>
                {unread > 0 && (
                  <motion.span
                    className={`${styles.badge} ${props.badgeClassName ?? ''}`}
                    initial={{scale: 0, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    exit={{scale: 0, opacity: 0}}
                    transition={{type: "spring", stiffness: 500, damping: 30}}
                  >
                    {unread}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent align={'end'} className={styles.popoverContent}>
        <motion.div
          className={styles.notificationHeader}
          initial={{opacity: 0, y: -10}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.2}}
        >
          <div className={styles.headerContent}>
            <div>
              <h4 className={styles.title}>Notifications</h4>
              {unread && unread > 0 ? <p className={styles.description}>Bạn có {unread} thông báo chưa đọc.</p> : null}
            </div>
            {unread > 0 && (
              <motion.button
                className={styles.markAllButton}
                onClick={markAllRead}
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
              >
                <LucideCheck size={14}/>
                Mark all read
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div
          className={styles.notificationList}
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 0.3, delay: 0.1}}
        >
          <div className={styles.infoContainer}>
            <div />
            <a className={styles.showAllText}>
              Xem tất cả
            </a>
          </div>
          {notis.map((notification, index) => (
            <motion.div
              className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : styles.read}`}
              key={notification.id}
              layout
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: 20, height: 0}}
              transition={{
                duration: 0.3,
                delay: 0.1 + index * 0.05,
                ease: "easeOut",
              }}
              whileHover={{
                scale: 1.02,
                backgroundColor: notification.isRead ? "rgba(0, 0, 0, 0.02)" : "rgba(59, 130, 246, 0.05)",
              }}
              onClick={() => {
                if (!notification.isRead)
                  markRead(notification.id)
                if (notification.url) {
                  navigate(notification.url)
                }
              }}
            >
              <motion.div
                className={styles.dotContainer}
                initial={{scale: 0}}
                animate={{scale: 1}}
                transition={{
                  duration: 0.2,
                  delay: 0.2 + index * 0.05,
                  type: "spring",
                  stiffness: 500,
                }}
              >
                <motion.span
                  className={styles.dot}
                  style={{
                    backgroundColor: notification.isRead ? "#d1d5db" : getTypeColor(notification.type),
                  }}
                  animate={{
                    backgroundColor: notification.isRead ? "#d1d5db" : getTypeColor(notification.type),
                  }}
                  transition={{duration: 0.3}}
                />
              </motion.div>
              <div className={styles.notificationText}>
                <p className={styles.message}>{notification.content}</p>
                <p className={styles.time}>{formatCreatedAt(notification.createdAt)}</p>
              </div>
              <motion.button
                className={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation()
                  markRead(notification.id)
                }}
                whileHover={{scale: 1.1}}
                whileTap={{scale: 0.9}}
                title={notification.isRead ? "Mark as unread" : "Mark as read"}
              >
                <AnimatePresence mode="wait">
                  {notification.isRead ? (
                    <motion.div
                      key="unread"
                      initial={{rotate: -90, opacity: 0}}
                      animate={{rotate: 0, opacity: 1}}
                      exit={{rotate: 90, opacity: 0}}
                      transition={{duration: 0.2}}
                      onClick={() => delNoti(notification.id)}
                    >
                      <LucideX size={14}/>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="read"
                      initial={{rotate: -90, opacity: 0}}
                      animate={{rotate: 0, opacity: 1}}
                      exit={{rotate: 90, opacity: 0}}
                      transition={{duration: 0.2}}
                    >
                      <LucideCheck size={14}/>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </PopoverContent>
    </Popover>
  )
}