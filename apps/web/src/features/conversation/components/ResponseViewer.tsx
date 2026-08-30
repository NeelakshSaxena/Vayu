import React, { useMemo, useEffect, useRef } from 'react';
import { Response } from '../../../components/ui/response';
import { cn } from '../../../lib/utils';

interface ResponseViewerProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ 
  content, 
  isStreaming,
  className
}) => {
  // We extract the thinkContent and mainContent from the display string
  // If streaming, we just use the raw content. We don't need unstable suffix stripping
  // if we aren't using displayContent directly.
  const displayContent = content;
  
  const { thinkContent, mainContent } = useMemo(() => {
    let text = displayContent;
    let thinkText = "";
    
    // Extract <think> block if present
    if (text.includes("<think>")) {
      const parts = text.split("<think>");
      const afterThink = parts[1] || "";
      
      if (afterThink.includes("</think>")) {
         const thinkParts = afterThink.split("</think>");
         thinkText = thinkParts[0];
         text = parts[0] + thinkParts[1];
      } else {
         // Still streaming the think block
         thinkText = afterThink;
         text = parts[0];
      }
    }
    
    return { thinkContent: thinkText.trim(), mainContent: text.trim() };
  }, [displayContent]);

  // Screen reader polite live region for chunks
  const prevContentRef = useRef("");
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isStreaming) return;
    
    // Announce when a sentence completes (ends with . ! ? followed by space or newline)
    const addedText = mainContent.substring(prevContentRef.current.length);
    const sentenceMatch = addedText.match(/.*[.!?](?=\s|$)/s);
    
    if (sentenceMatch && liveRegionRef.current) {
      const chunkToAnnounce = sentenceMatch[0];
      liveRegionRef.current.textContent = chunkToAnnounce;
      prevContentRef.current = mainContent.substring(0, prevContentRef.current.length + chunkToAnnounce.length);
    }
  }, [mainContent, isStreaming]);

  // Flush remaining unannounced text when finished
  useEffect(() => {
    if (!isStreaming && mainContent.length > prevContentRef.current.length && liveRegionRef.current) {
      liveRegionRef.current.textContent = mainContent.substring(prevContentRef.current.length);
      prevContentRef.current = mainContent;
    }
  }, [isStreaming, mainContent]);

  return (
    <div className={cn("relative flex flex-col gap-3", className)}>
      {thinkContent && (
        <details className="group border border-white/10 rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-black/5 dark:bg-white/5">
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 select-none">
            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            Thinking Process
          </summary>
          <div className="p-4 text-sm text-black/60 dark:text-white/60 bg-black/10 dark:bg-black/20 whitespace-pre-wrap font-mono border-t border-black/10 dark:border-white/10">
            {thinkContent}
          </div>
        </details>
      )}
      {mainContent && <Response>{mainContent}</Response>}
      
      {/* Hidden live region for accessibility */}
      <div 
        ref={liveRegionRef} 
        aria-live="polite" 
        aria-atomic="false" 
        className="sr-only"
      />
    </div>
  );
};
