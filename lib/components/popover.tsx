import React, { useState, useRef, useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import styles from "./popover.module.css"
import { motion, AnimatePresence } from "framer-motion"

interface PopoverContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
}

const PopoverContext = React.createContext<PopoverContextType | null>(null)

interface PopoverProps {
  children: ReactNode
}

export function Popover({ children }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)

  return <PopoverContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>{children}</PopoverContext.Provider>
}

interface PopoverTriggerProps {
  children: ReactNode
  asChild?: boolean
}

export function PopoverTrigger({ children, asChild = false }: PopoverTriggerProps) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error("PopoverTrigger must be used within Popover")

  const { isOpen, setIsOpen, triggerRef } = context

  const handleClick = () => {
    setIsOpen(!isOpen)
  }

  if (asChild && React.isValidElement(children)) {
    // @ts-ignore
    return React.cloneElement(children, {ref: triggerRef, onClick: handleClick,})
  }

  return (
    <button ref={triggerRef as React.RefObject<HTMLButtonElement>} onClick={handleClick} className={styles.trigger}>
      {children}
    </button>
  )
}

interface PopoverContentProps {
  children: ReactNode
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function PopoverContent({ children, className = "", align = "center", side = "bottom" }: PopoverContentProps) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error("PopoverContent must be used within Popover")

  const { isOpen, setIsOpen, triggerRef } = context
  const contentRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, transformOrigin: "top center" })

  useEffect(() => {
    if (isOpen && triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const contentRect = contentRef.current.getBoundingClientRect()
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      }

      let finalSide = side
      const finalAlign = align
      let top = 0
      let left = 0

      // Check if there's enough space on the preferred side
      const spaceTop = triggerRect.top
      const spaceBottom = viewport.height - triggerRect.bottom
      const spaceLeft = triggerRect.left
      const spaceRight = viewport.width - triggerRect.right

      // Auto-flip side if not enough space
      if (side === "bottom" && spaceBottom < contentRect.height + 8) {
        if (spaceTop > spaceBottom) {
          finalSide = "top"
        }
      } else if (side === "top" && spaceTop < contentRect.height + 8) {
        if (spaceBottom > spaceTop) {
          finalSide = "bottom"
        }
      } else if (side === "right" && spaceRight < contentRect.width + 8) {
        if (spaceLeft > spaceRight) {
          finalSide = "left"
        }
      } else if (side === "left" && spaceLeft < contentRect.width + 8) {
        if (spaceRight > spaceLeft) {
          finalSide = "right"
        }
      }

      // Calculate position based on final side
      switch (finalSide) {
        case "bottom":
          top = triggerRect.bottom + window.scrollY + 8
          break
        case "top":
          top = triggerRect.top + window.scrollY - contentRect.height - 8
          break
        case "right":
          top = triggerRect.top + window.scrollY
          left = triggerRect.right + window.scrollX + 8
          break
        case "left":
          top = triggerRect.top + window.scrollY
          left = triggerRect.left + window.scrollX - contentRect.width - 8
          break
      }

      // Calculate alignment and adjust if overflowing
      if (finalSide === "top" || finalSide === "bottom") {
        switch (finalAlign) {
          case "start":
            left = triggerRect.left + window.scrollX
            break
          case "center":
            left = triggerRect.left + window.scrollX + triggerRect.width / 2 - contentRect.width / 2
            break
          case "end":
            left = triggerRect.right + window.scrollX - contentRect.width
            break
        }

        // Adjust horizontal position if overflowing viewport
        if (left < 8) {
          left = 8
        } else if (left + contentRect.width > viewport.width - 8) {
          left = viewport.width - contentRect.width - 8
        }
      } else {
        // For left/right sides, adjust vertical alignment
        switch (finalAlign) {
          case "start":
            top = triggerRect.top + window.scrollY
            break
          case "center":
            top = triggerRect.top + window.scrollY + triggerRect.height / 2 - contentRect.height / 2
            break
          case "end":
            top = triggerRect.bottom + window.scrollY - contentRect.height
            break
        }

        // Adjust vertical position if overflowing viewport
        if (top < 8) {
          top = 8
        } else if (top + contentRect.height > viewport.height - 8) {
          top = viewport.height - contentRect.height - 8
        }
      }

      let transformOrigin = "top center"

      switch (finalSide) {
        case "bottom":
          transformOrigin = "top center"
          break
        case "top":
          transformOrigin = "bottom center"
          break
        case "right":
          transformOrigin = "left center"
          break
        case "left":
          transformOrigin = "right center"
          break
      }

      setPosition({ top, left, transformOrigin })
    }
  }, [isOpen, align, side])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, setIsOpen])

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={contentRef}
          className={`${styles.content} ${className}`}
          style={{
            position: "absolute",
            top: position.top,
            left: position.left,
            zIndex: 50,
          }}
          initial={{
            opacity: 0,
            scale: 0.95,
            y: position.transformOrigin.includes("bottom") ? 10 : -10,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: position.transformOrigin.includes("bottom") ? 10 : -10,
          }}
          transition={{
            duration: 0.15,
            ease: "easeOut",
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
