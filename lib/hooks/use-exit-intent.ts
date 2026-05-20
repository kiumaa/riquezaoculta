"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseExitIntentOptions {
  threshold?: number; // milliseconds before showing again
  maxDisplays?: number;
  onExitIntent: () => void;
}

const STORAGE_KEY = "ro_exit_intent_last_shown";
const DISPLAY_COUNT_KEY = "ro_exit_intent_count";

export function useExitIntent({
  threshold = 24 * 60 * 60 * 1000, // 24 hours
  maxDisplays = 3,
  onExitIntent
}: UseExitIntentOptions) {
  const isMobile = useRef(false);
  const hasTriggered = useRef(false);

  // Check if we should show the exit intent
  const shouldShow = useCallback(() => {
    if (typeof window === "undefined") return false;
    
    const lastShown = localStorage.getItem(STORAGE_KEY);
    const displayCount = parseInt(localStorage.getItem(DISPLAY_COUNT_KEY) || "0", 10);
    
    if (displayCount >= maxDisplays) return false;
    if (!lastShown) return true;
    
    const timeSince = Date.now() - parseInt(lastShown, 10);
    return timeSince >= threshold;
  }, [threshold, maxDisplays]);

  // Record that we showed the exit intent
  const recordDisplay = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const currentCount = parseInt(localStorage.getItem(DISPLAY_COUNT_KEY) || "0", 10);
    localStorage.setItem(DISPLAY_COUNT_KEY, String(currentCount + 1));
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Detect mobile
    isMobile.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Desktop: mouseleave event
    const handleMouseLeave = (e: MouseEvent) => {
      if (hasTriggered.current) return;
      
      // Only trigger when mouse leaves towards the top of the page
      if (e.clientY <= 10 && shouldShow()) {
        hasTriggered.current = true;
        recordDisplay();
        onExitIntent();
      }
    };

    // Mobile: scroll up rapidly or reach top with momentum
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    
    const handleScroll = () => {
      if (hasTriggered.current || !isMobile.current) return;
      
      const currentScrollY = window.scrollY;
      const delta = lastScrollY - currentScrollY;
      scrollVelocity = delta;
      
      // Trigger if scrolling up fast and near top
      if (scrollVelocity > 50 && currentScrollY < 100 && shouldShow()) {
        hasTriggered.current = true;
        recordDisplay();
        onExitIntent();
      }
      
      lastScrollY = currentScrollY;
    };

    // Mobile: back button detection (using visibility change as proxy)
    const handleVisibilityChange = () => {
      if (hasTriggered.current || !isMobile.current) return;
      
      // When user is about to leave (switch tabs, etc)
      if (document.visibilityState === "hidden" && shouldShow()) {
        // We can't really show a modal here, but we can set a flag
        // The modal will show when they come back
        sessionStorage.setItem("ro_show_on_return", "true");
      } else if (document.visibilityState === "visible") {
        const shouldShowOnReturn = sessionStorage.getItem("ro_show_on_return");
        if (shouldShowOnReturn === "true") {
          sessionStorage.removeItem("ro_show_on_return");
          hasTriggered.current = true;
          recordDisplay();
          onExitIntent();
        }
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onExitIntent, shouldShow, recordDisplay]);

  return { shouldShow, recordDisplay };
}
