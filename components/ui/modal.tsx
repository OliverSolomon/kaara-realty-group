"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-[#000B1D]/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className={cn(
        "relative z-[2100] w-full max-w-4xl bg-white shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200",
        className
      )}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#000B1D] transition-colors p-2">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
