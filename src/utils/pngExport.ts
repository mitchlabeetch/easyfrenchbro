import html2canvas from 'html2canvas';
import JSZip from 'jszip';

export interface PngExportOptions {
  /** Whether to make the background transparent */
  transparentBackground: boolean;
  /** Image scale factor (1 = 100%, 2 = 200% for retina) */
  scale: number;
  /** Whether to include UI elements (line numbers, buttons, etc.) */
  includeUIElements: boolean;
  /** Page background color (used when transparentBackground is false) */
  backgroundColor: string;
}

export const defaultPngExportOptions: PngExportOptions = {
  transparentBackground: false,
  scale: 2,
  includeUIElements: false,
  backgroundColor: '#ffffff',
};

/**
 * Capture a single page element as PNG
 */
export async function capturePageAsPng(
  pageElement: HTMLElement,
  options: Partial<PngExportOptions> = {}
): Promise<Blob> {
  const opts = { ...defaultPngExportOptions, ...options };
  
  // Clone the element for manipulation without affecting the original
  const clone = pageElement.cloneNode(true) as HTMLElement;
  
  // Remove UI-only elements if not including them
  if (!opts.includeUIElements) {
    const uiElements = clone.querySelectorAll('.no-print, .group-hover\\:block, .group-hover\\:flex');
    uiElements.forEach(el => el.remove());
    
    // Also hide hover states and interactive elements
    const interactiveElements = clone.querySelectorAll('[title], button:not(.content-button)');
    interactiveElements.forEach(el => {
      if (el.closest('.line-column') || el.closest('.absolute')) {
        el.remove();
      }
    });
  }
  
  // Create a container that is on-screen but visually hidden
  // This helps html2canvas properly compute styles
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = 'auto';
  container.style.height = 'auto';
  container.style.zIndex = '-9999';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'visible';
  
  // Reset clone styles to ensure proper rendering
  clone.style.position = 'relative';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.margin = '0';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';
  clone.setAttribute('data-page-export', 'true');
  
  container.appendChild(clone);
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(clone, {
      scale: opts.scale,
      backgroundColor: opts.transparentBackground ? null : opts.backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
      // Process the cloned document for better rendering
      onclone: (_clonedDoc: Document, element: HTMLElement) => {
        // Ensure all text is visible and properly styled
        const allText = element.querySelectorAll('span, div, p, h1, h2, h3, h4, h5, h6, input, textarea');
        allText.forEach((el) => {
          if (el instanceof HTMLElement) {
            // Force text to be visible
            el.style.overflow = 'visible';
            el.style.textOverflow = 'clip';
            el.style.whiteSpace = 'normal';
          }
        });
        
        // Handle callout boxes specifically
        const callouts = element.querySelectorAll('.callout-box, .callout-header');
        callouts.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.overflow = 'visible';
          }
        });
        
        // If transparent, ensure backgrounds are properly handled
        if (opts.transparentBackground) {
          element.style.backgroundColor = 'transparent';
        }
      }
    });
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create PNG blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Export a single page as PNG download
 */
export async function exportSinglePageAsPng(
  pageElement: HTMLElement,
  filename: string,
  options: Partial<PngExportOptions> = {}
): Promise<void> {
  const blob = await capturePageAsPng(pageElement, options);
  downloadBlob(blob, filename);
}

/**
 * Export multiple pages as a ZIP file containing PNGs
 */
export async function exportMultiplePagesAsZip(
  pageElements: HTMLElement[],
  zipFilename: string,
  basePageName: string,
  options: Partial<PngExportOptions> = {},
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const total = pageElements.length;
  
  for (let i = 0; i < pageElements.length; i++) {
    const pageElement = pageElements[i];
    const paddedIndex = String(i + 1).padStart(3, '0');
    const filename = `${basePageName}_page_${paddedIndex}.png`;
    
    try {
      const blob = await capturePageAsPng(pageElement, options);
      zip.file(filename, blob);
      
      if (onProgress) {
        onProgress(i + 1, total);
      }
    } catch (error) {
      console.error(`Failed to capture page ${i + 1}:`, error);
      // Continue with other pages
    }
  }
  
  // Generate ZIP and download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, zipFilename);
}

/**
 * Render pages off-screen for export (useful when pages aren't currently visible)
 */
export async function renderPagesForExport(
  createPageElement: (pageIndex: number) => HTMLElement,
  pageCount: number,
  options: Partial<PngExportOptions> = {},
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  const blobs: Blob[] = [];
  
  for (let i = 0; i < pageCount; i++) {
    const pageElement = createPageElement(i);
    
    // Temporarily add to DOM for rendering
    pageElement.style.position = 'absolute';
    pageElement.style.left = '-9999px';
    pageElement.style.top = '0';
    pageElement.setAttribute('data-page-export', 'true');
    document.body.appendChild(pageElement);
    
    try {
      const blob = await capturePageAsPng(pageElement, options);
      blobs.push(blob);
      
      if (onProgress) {
        onProgress(i + 1, pageCount);
      }
    } finally {
      document.body.removeChild(pageElement);
    }
  }
  
  return blobs;
}

/**
 * Helper to download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default {
  capturePageAsPng,
  exportSinglePageAsPng,
  exportMultiplePagesAsZip,
  renderPagesForExport,
  defaultPngExportOptions,
};
