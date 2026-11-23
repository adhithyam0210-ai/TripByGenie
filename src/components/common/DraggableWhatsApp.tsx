import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface Position {
  x: number;
  y: number;
}

interface DraggableWhatsAppProps {
  isModalOpen?: boolean;
}

export const DraggableWhatsApp: React.FC<DraggableWhatsAppProps> = ({ isModalOpen = false }) => {
  const location = useLocation();
  const [position, setPosition] = useState<Position | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number; hasMoved: boolean }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    hasMoved: false
  });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Clear any previously persisted positions on mount so refresh always resets to the default bottom-right position
  useEffect(() => {
    try {
      localStorage.removeItem('tg_whatsapp_pos');
    } catch {
      // ignore
    }
  }, []);

  // When opening a new page or navigating, reset back to default bottom-right position
  useEffect(() => {
    setHasDragged(false);
    setPosition(null);
  }, [location.pathname]);

  // Keep button within screen bounds on window resize if currently dragged
  useEffect(() => {
    const handleResize = () => {
      if (!hasDragged) return;
      setPosition((prev) => {
        if (!prev) return null;
        const btnSize = 60;
        const maxX = window.innerWidth - btnSize - 10;
        const maxY = window.innerHeight - btnSize - 10;
        return {
          x: Math.max(10, Math.min(maxX, prev.x)),
          y: Math.max(10, Math.min(maxY, prev.y))
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasDragged]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to primary click / touch
    if (e.button !== 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: rect.left,
      posY: rect.top,
      hasMoved: false
    };

    setPosition({ x: rect.left, y: rect.top });
    setIsDragging(true);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragStartRef.current.hasMoved = true;
      setHasDragged(true);
    }

    const btnSize = 60;
    const maxX = window.innerWidth - btnSize - 10;
    const maxY = window.innerHeight - btnSize - 10;

    const newX = Math.max(10, Math.min(maxX, dragStartRef.current.posX + deltaX));
    const newY = Math.max(10, Math.min(maxY, dragStartRef.current.posY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      const target = e.currentTarget as HTMLElement;
      target.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // If user tapped/clicked without dragging, open WhatsApp
    if (!dragStartRef.current.hasMoved) {
      window.open(
        'https://wa.me/919940463566?text=Hi%20TripByGenie%2C%20I%20would%20like%20to%20enquire%20about%20a%20travel%20package.',
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  // 1. Only show on the landing page (home)
  if (location.pathname !== '/') return null;

  // 2. Hide completely when trip modal or popup is open
  if (isModalOpen) return null;

  return (
    <div
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setIsDragging(false)}
      style={
        hasDragged && position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              touchAction: 'none'
            }
          : {
              touchAction: 'none'
            }
      }
      className={`fixed z-20 select-none cursor-grab active:cursor-grabbing ${
        !hasDragged ? 'bottom-6 right-6' : ''
      } ${isDragging ? 'scale-105 transition-none' : 'transition-transform duration-150'}`}
      aria-label="Chat with us on WhatsApp (Drag to move)"
      title="Chat with us on WhatsApp (Drag to move)"
    >
      <div className="relative w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-2xl flex items-center justify-center ring-4 ring-[#25D366]/30 hover:scale-105 active:scale-95 transition-all">
        {/* Crisp clean official WhatsApp phone icon */}
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 fill-white pointer-events-none"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </div>
    </div>
  );
};
