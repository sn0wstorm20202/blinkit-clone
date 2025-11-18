"use client";

import { useEffect, useRef } from "react";
import { MapPin, LocateFixed, Search, X } from "lucide-react";

interface LocationModalProps {
  onClose: () => void;
}

export default function LocationModal({ onClose }: LocationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in-0 duration-300">
      <div
        ref={modalRef}
        className="relative bg-background rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] w-full max-w-[550px] p-8 m-4"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-secondary transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div>
          <h2 className="text-[32px] font-bold text-text-primary">
            Welcome to <span className="text-primary">blinkit</span>
          </h2>
        </div>

        <div className="flex items-start mt-8">
          <MapPin
            className="text-text-tertiary mt-0.5 mr-4 flex-shrink-0"
            size={28}
          />
          <p className="text-text-secondary text-base leading-snug">
            Please provide your delivery location to see products at nearby store
          </p>
        </div>

        <button className="w-full mt-8 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-semibold text-sm bg-[linear-gradient(90deg,#1ca32f_0%,#23c73a_100%)] hover:opacity-95 transition-opacity">
          <LocateFixed size={18} />
          Detect my location
        </button>

        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-border"></div>
          <span className="mx-4 text-sm font-semibold text-text-tertiary/80">
            OR
          </span>
          <div className="flex-grow h-px bg-border"></div>
        </div>

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
            size={20}
          />
          <input
            type="text"
            placeholder="Search for area, street name..."
            className="w-full h-12 pl-12 pr-4 text-base border-2 border-primary rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none placeholder:text-text-tertiary bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}