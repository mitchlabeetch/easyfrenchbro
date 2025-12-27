import React from 'react';
import { clsx } from 'clsx';
import type { PageData, PageLayout, ViewMode } from '../types';

// ─────────────────────────────────────────────────────────────────
// PAGE SPREAD VIEW COMPONENT
// Two-page spread view for checking gutter alignment
// ─────────────────────────────────────────────────────────────────

interface PageSpreadViewProps {
  leftPage: PageData | null;  // Verso (even page)
  rightPage: PageData | null; // Recto (odd page)
  leftPageNumber: number;
  rightPageNumber: number;
  pageLayout: PageLayout;
  renderPage: (page: PageData, isRecto: boolean) => React.ReactNode;
  onPageClick?: (pageIndex: number) => void;
  zoomLevel?: number;
}

export const PageSpreadView: React.FC<PageSpreadViewProps> = ({
  leftPage,
  rightPage,
  leftPageNumber,
  rightPageNumber,
  pageLayout,
  renderPage,
  onPageClick,
  zoomLevel = 0.5,
}) => {
  // Calculate effective margins with gutter
  const getPageStyle = (isRecto: boolean) => {
    const baseStyle = {
      width: pageLayout.width,
      height: pageLayout.height,
      backgroundColor: '#ffffff',
    };

    if (pageLayout.mirrorMargins && pageLayout.gutter) {
      const gutterValue = pageLayout.gutter;
      if (isRecto) {
        // Right page: gutter on left
        return {
          ...baseStyle,
          paddingTop: pageLayout.margins.top,
          paddingRight: pageLayout.margins.right,
          paddingBottom: pageLayout.margins.bottom,
          paddingLeft: `calc(${pageLayout.margins.left} + ${gutterValue})`,
        };
      } else {
        // Left page: gutter on right
        return {
          ...baseStyle,
          paddingTop: pageLayout.margins.top,
          paddingRight: `calc(${pageLayout.margins.right} + ${gutterValue})`,
          paddingBottom: pageLayout.margins.bottom,
          paddingLeft: pageLayout.margins.left,
        };
      }
    }

    return {
      ...baseStyle,
      padding: `${pageLayout.margins.top} ${pageLayout.margins.right} ${pageLayout.margins.bottom} ${pageLayout.margins.left}`,
    };
  };

  return (
    <div className="spread-view-container flex justify-center items-start p-8 bg-gray-700 rounded-lg">
      {/* Spread wrapper */}
      <div 
        className="spread-view flex gap-0.5 relative"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
      >
        {/* Left Page (Verso - Even) */}
        <div 
          className={clsx(
            'page page-verso relative cursor-pointer transition-shadow',
            'hover:shadow-2xl',
            !leftPage && 'opacity-50'
          )}
          style={getPageStyle(false)}
          onClick={() => leftPage && onPageClick?.(leftPageNumber - 1)}
        >
          {/* Page number indicator */}
          <div className="absolute top-2 left-4 text-xs text-gray-400 no-print">
            {leftPageNumber}
          </div>
          
          {/* Gutter shadow (visual binding effect) */}
          <div 
            className="absolute top-0 right-0 bottom-0 w-4 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, rgba(0,0,0,0.1), transparent)'
            }}
          />
          
          {leftPage ? (
            renderPage(leftPage, false)
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 italic text-sm">
              (Blank Page)
            </div>
          )}
        </div>

        {/* Center binding line */}
        <div className="binding-line w-1 bg-gray-800 shadow-inner" />

        {/* Right Page (Recto - Odd) */}
        <div 
          className={clsx(
            'page page-recto relative cursor-pointer transition-shadow',
            'hover:shadow-2xl',
            !rightPage && 'opacity-50'
          )}
          style={getPageStyle(true)}
          onClick={() => rightPage && onPageClick?.(rightPageNumber - 1)}
        >
          {/* Page number indicator */}
          <div className="absolute top-2 right-4 text-xs text-gray-400 no-print">
            {rightPageNumber}
          </div>
          
          {/* Gutter shadow (visual binding effect) */}
          <div 
            className="absolute top-0 left-0 bottom-0 w-4 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.1), transparent)'
            }}
          />
          
          {rightPage ? (
            renderPage(rightPage, true)
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 italic text-sm">
              (Blank Page)
            </div>
          )}
        </div>
      </div>

      {/* Spread info */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                      bg-gray-800 text-white text-xs px-3 py-1 rounded-full no-print">
        Pages {leftPageNumber} – {rightPageNumber}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// VIEW MODE SELECTOR
// Toggle between single, spread, and continuous views
// ─────────────────────────────────────────────────────────────────

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  currentMode,
  onModeChange,
}) => {
  const modes: Array<{ mode: ViewMode; icon: string; label: string }> = [
    { mode: 'single', icon: '📄', label: 'Single Page' },
    { mode: 'spread', icon: '📖', label: 'Two-Page Spread' },
    { mode: 'continuous', icon: '📜', label: 'Continuous Scroll' },
  ];

  return (
    <div className="flex rounded-lg border bg-white overflow-hidden">
      {modes.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={clsx(
            'px-3 py-1.5 text-xs flex items-center gap-1 transition-colors',
            currentMode === mode
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          )}
          title={label}
        >
          <span>{icon}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// GUTTER GUIDE OVERLAY
// Visual indicator for gutter margins
// ─────────────────────────────────────────────────────────────────

interface GutterGuideProps {
  gutter: string;
  mirrorMargins: boolean;
  isRecto: boolean;
  visible?: boolean;
}

export const GutterGuide: React.FC<GutterGuideProps> = ({
  gutter,
  mirrorMargins,
  isRecto,
  visible = true,
}) => {
  if (!visible || !mirrorMargins) return null;

  const position = isRecto ? 'left' : 'right';

  return (
    <div 
      className="gutter-guide absolute top-0 bottom-0 pointer-events-none"
      style={{
        [position]: gutter,
        width: '1px',
        background: 'repeating-linear-gradient(to bottom, #3b82f6 0, #3b82f6 4px, transparent 4px, transparent 8px)',
        opacity: 0.5,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────
// PAGE NAVIGATOR FOR SPREAD VIEW
// ─────────────────────────────────────────────────────────────────

interface SpreadNavigatorProps {
  currentSpread: number; // 0-indexed spread number
  totalPages: number;
  onNavigate: (spreadIndex: number) => void;
}

export const SpreadNavigator: React.FC<SpreadNavigatorProps> = ({
  currentSpread,
  totalPages,
  onNavigate,
}) => {
  const totalSpreads = Math.ceil(totalPages / 2);
  const canGoPrev = currentSpread > 0;
  const canGoNext = currentSpread < totalSpreads - 1;

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow px-3 py-2">
      <button
        onClick={() => canGoPrev && onNavigate(currentSpread - 1)}
        disabled={!canGoPrev}
        className={clsx(
          'px-2 py-1 rounded text-sm',
          canGoPrev 
            ? 'text-gray-700 hover:bg-gray-100' 
            : 'text-gray-300 cursor-not-allowed'
        )}
      >
        ← Prev
      </button>
      
      <div className="text-xs text-gray-500 px-2">
        Spread {currentSpread + 1} of {totalSpreads}
      </div>
      
      <button
        onClick={() => canGoNext && onNavigate(currentSpread + 1)}
        disabled={!canGoNext}
        className={clsx(
          'px-2 py-1 rounded text-sm',
          canGoNext 
            ? 'text-gray-700 hover:bg-gray-100' 
            : 'text-gray-300 cursor-not-allowed'
        )}
      >
        Next →
      </button>
    </div>
  );
};

export default PageSpreadView;
