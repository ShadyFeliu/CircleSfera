"use client";

import { useEffect, useState } from "react";

type NotificationType = "success" | "error" | "warning" | "info";

type NotificationProps = {
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
};

const Notification = ({ message, type, duration = 5000, onClose }: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success": return "✅";
      case "error": return "❌";
      case "warning": return "⚠️";
      case "info": return "ℹ️";
      default: return "ℹ️";
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success": return "bg-green-600";
      case "error": return "bg-red-600";
      case "warning": return "bg-yellow-600";
      case "info": return "bg-blue-600";
      default: return "bg-blue-600";
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 ${getBgColor()} text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm animate-slide-in`}>
      <div className="flex items-center space-x-3">
        <span className="text-xl">{getIcon()}</span>
        <p className="flex-1">{message}</p>
        <button 
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="text-white hover:text-gray-200 text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification; 