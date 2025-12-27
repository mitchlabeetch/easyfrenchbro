import React from 'react';
import { clsx } from 'clsx';
import type { 
  PageContent, 
  TextContent, 
  ImageContent, 
  TableContent, 
  DividerContent, 
  CalloutContent 
} from '../types';
import { CalloutBox } from './CalloutBox';
import { WordGroupRenderer } from './WordGroupRenderer';

// ─────────────────────────────────────────────────────────────────
// CONTENT BLOCK RENDERER
// Renders different types of page content (text, image, table, etc.)
// ─────────────────────────────────────────────────────────────────

interface ContentBlockRendererProps {
  content: PageContent;
  showFrench?: boolean;
  showEnglish?: boolean;
  splitRatio?: number;
  editable?: boolean;
  onUpdate?: (updates: Partial<PageContent>) => void;
  onDelete?: () => void;
  onDoubleClick?: (e: React.MouseEvent, language: 'french' | 'english') => void;
  className?: string;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({
  content,
  showFrench = true,
  showEnglish = true,
  splitRatio = 0.5,
  editable = false,
  onUpdate,
  onDelete,
  onDoubleClick,
  className,
}) => {
  switch (content.type) {
    case 'text':
      return (
        <TextBlockRenderer
          content={content}
          showFrench={showFrench}
          showEnglish={showEnglish}
          splitRatio={splitRatio}
          editable={editable}
          onUpdate={onUpdate}
          onDoubleClick={onDoubleClick}
          className={className}
        />
      );
    
    case 'image':
      return (
        <ImageBlockRenderer
          content={content}
          editable={editable}
          onUpdate={onUpdate}
          onDelete={onDelete}
          className={className}
        />
      );
    
    case 'table':
      return (
        <TableBlockRenderer
          content={content}
          editable={editable}
          onUpdate={onUpdate}
          onDelete={onDelete}
          className={className}
        />
      );
    
    case 'divider':
      return (
        <DividerBlockRenderer
          content={content}
          onDelete={onDelete}
          className={className}
        />
      );
    
    case 'callout':
      return (
        <CalloutBlockRenderer
          content={content}
          editable={editable}
          onUpdate={onUpdate}
          onDelete={onDelete}
          className={className}
        />
      );
    
    default:
      return (
        <div className="text-red-500 text-sm p-2 border border-red-200 rounded">
          Unknown content type
        </div>
      );
  }
};

// ─────────────────────────────────────────────────────────────────
// TEXT BLOCK RENDERER (Bilingual Text)
// ─────────────────────────────────────────────────────────────────

interface TextBlockRendererProps {
  content: TextContent;
  showFrench: boolean;
  showEnglish: boolean;
  splitRatio: number;
  editable?: boolean;
  onUpdate?: (updates: Partial<TextContent>) => void;
  onDoubleClick?: (e: React.MouseEvent, language: 'french' | 'english') => void;
  className?: string;
}

const TextBlockRenderer: React.FC<TextBlockRendererProps> = ({
  content,
  showFrench,
  showEnglish,
  splitRatio,
  editable: _editable,
  onDoubleClick,
  className,
}) => {
  const getGridTemplate = () => {
    if (showFrench && showEnglish) {
      return `${splitRatio}fr ${1 - splitRatio}fr`;
    }
    return '1fr';
  };

  const lineClasses = clsx(
    content.sectionType === 'title' && 'text-2xl font-bold text-center',
    content.sectionType === 'heading' && 'text-xl font-bold',
    content.sectionType === 'note' && 'text-sm italic text-gray-500 bg-yellow-50 border-l-4 border-yellow-300 pl-3',
  );

  // Show line number if applicable
  const showLineNumber = !content.skipNumbering && content.lineNumber;

  return (
    <div 
      className={clsx('relative', className)}
      style={{ 
        display: 'grid', 
        gridTemplateColumns: getGridTemplate(),
        gap: '4mm'
      }}
    >
      {/* Line number */}
      {showLineNumber && (
        <div className="absolute -left-8 text-gray-300 text-sm font-mono">
          {content.manualLineNumber || content.lineNumber}
        </div>
      )}

      {/* French column */}
      {showFrench && (
        <div 
          className={clsx(
            'french-column p-1 rounded hover:bg-gray-50',
            lineClasses
          )}
          onDoubleClick={(e) => onDoubleClick?.(e, 'french')}
        >
          <WordGroupRenderer 
            text={content.frenchText} 
            language="french" 
            lineId={content.id}
            styles={content.frenchStyles}
          />
        </div>
      )}

      {/* English column */}
      {showEnglish && (
        <div 
          className={clsx(
            'english-column p-1 rounded hover:bg-gray-50',
            showFrench && 'border-l border-gray-100 pl-4',
            'text-gray-600 italic',
            content.sectionType === 'title' && 'text-lg not-italic',
            content.sectionType === 'heading' && 'text-base not-italic',
          )}
          onDoubleClick={(e) => onDoubleClick?.(e, 'english')}
        >
          <WordGroupRenderer 
            text={content.englishText} 
            language="english" 
            lineId={content.id}
            styles={content.englishStyles}
          />
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// IMAGE BLOCK RENDERER
// ─────────────────────────────────────────────────────────────────

interface ImageBlockRendererProps {
  content: ImageContent;
  editable?: boolean;
  onUpdate?: (updates: Partial<ImageContent>) => void;
  onDelete?: () => void;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars

const ImageBlockRenderer: React.FC<ImageBlockRendererProps> = ({
  content,
  editable: _editable,
  onUpdate: _onUpdate,
  onDelete,
  className,
}) => {
  return (
    <figure 
      className={clsx(
        'book-figure my-4 break-inside-avoid relative group',
        content.alignment === 'left' && 'mr-auto',
        content.alignment === 'right' && 'ml-auto',
        content.alignment === 'center' && 'mx-auto',
        className
      )}
      style={{ 
        width: content.width || 'auto',
        maxWidth: '100%'
      }}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-2 -right-2 w-5 h-5 bg-white border rounded-full 
                     shadow-sm text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 
                     transition-opacity no-print text-xs z-10"
        >
          ×
        </button>
      )}

      <img
        src={content.src}
        alt={content.alt}
        className="book-image rounded shadow-sm"
        style={{
          width: content.width || '100%',
          height: content.height || 'auto',
        }}
      />

      {(content.caption || content.captionFrench) && (
        <figcaption className="text-center text-sm italic text-gray-500 mt-2">
          {content.captionFrench && (
            <div>{content.captionFrench}</div>
          )}
          {content.caption && (
            <div className="text-gray-400">{content.caption}</div>
          )}
        </figcaption>
      )}
    </figure>
  );
};

// ─────────────────────────────────────────────────────────────────
// TABLE BLOCK RENDERER
// ─────────────────────────────────────────────────────────────────

interface TableBlockRendererProps {
  content: TableContent;
  editable?: boolean;
  onUpdate?: (updates: Partial<TableContent>) => void;
  onDelete?: () => void;
  className?: string;
}

const TableBlockRenderer: React.FC<TableBlockRendererProps> = ({
  content,
  editable,
  onUpdate,
  onDelete,
  className,
}) => {
  const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
    if (!onUpdate) return;
    const newRows = [...content.rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = value;
    onUpdate({ rows: newRows });
  };

  const handleHeaderEdit = (colIndex: number, value: string) => {
    if (!onUpdate) return;
    const newHeaders = [...content.headers];
    newHeaders[colIndex] = value;
    onUpdate({ headers: newHeaders });
  };

  return (
    <div className={clsx('my-4 break-inside-avoid relative group', className)}>
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-2 -right-2 w-5 h-5 bg-white border rounded-full 
                     shadow-sm text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 
                     transition-opacity no-print text-xs z-10"
        >
          ×
        </button>
      )}

      <table 
        className="book-table w-full border-collapse"
        style={{ 
          borderStyle: content.borderStyle || 'solid' 
        }}
      >
        {content.headers.length > 0 && (
          <thead>
            <tr>
              {content.headers.map((header, i) => (
                <th 
                  key={i}
                  className="p-2 text-left border bg-gray-50 font-semibold text-sm"
                >
                  {editable ? (
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => handleHeaderEdit(i, e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 font-semibold"
                    />
                  ) : (
                    header
                  )}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {content.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="p-2 border text-sm">
                  {editable ? (
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 p-0"
                    />
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {content.caption && (
          <caption className="caption-bottom pt-2 text-sm italic text-gray-500">
            {content.captionFrench && <span>{content.captionFrench} • </span>}
            {content.caption}
          </caption>
        )}
      </table>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// DIVIDER BLOCK RENDERER
// ─────────────────────────────────────────────────────────────────

interface DividerBlockRendererProps {
  content: DividerContent;
  onDelete?: () => void;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars

const DividerBlockRenderer: React.FC<DividerBlockRendererProps> = ({
  content,
  onDelete,
  className,
}) => {
  const getDividerContent = () => {
    switch (content.dividerStyle) {
      case 'line':
        return <div className="divider-line w-1/2 h-px bg-gray-300 mx-auto" />;
      case 'dots':
        return <span className="divider-dots text-gray-400">• • •</span>;
      case 'asterisks':
        return <span className="divider-asterisks text-gray-400">* * *</span>;
      case 'fleuron':
        return <span className="divider-fleuron text-gray-400 text-lg">❧</span>;
      case 'ornament':
        return <span className="divider-ornament text-gray-400 text-lg">§</span>;
      default:
        return <div className="divider-line w-1/2 h-px bg-gray-300 mx-auto" />;
    }
  };

  return (
    <div 
      className={clsx(
        'divider flex items-center justify-center relative group',
        className
      )}
      style={{ padding: content.spacing || '10mm' }}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 w-4 h-4 bg-white border rounded-full 
                     shadow-sm text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 
                     transition-opacity no-print text-xs"
        >
          ×
        </button>
      )}
      
      {getDividerContent()}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// CALLOUT BLOCK RENDERER
// ─────────────────────────────────────────────────────────────────

interface CalloutBlockRendererProps {
  content: CalloutContent;
  editable?: boolean;
  onUpdate?: (updates: Partial<CalloutContent>) => void;
  onDelete?: () => void;
  className?: string;
}

const CalloutBlockRenderer: React.FC<CalloutBlockRendererProps> = ({
  content,
  editable,
  onUpdate,
  onDelete,
  className,
}) => {
  return (
    <CalloutBox
      type={content.calloutType}
      title={content.title}
      content={content.content}
      icon={content.icon}
      color={content.color}
      editable={editable}
      onContentChange={(newContent) => onUpdate?.({ content: newContent })}
      onTitleChange={(newTitle) => onUpdate?.({ title: newTitle })}
      onDelete={onDelete}
      className={className}
    />
  );
};

export default ContentBlockRenderer;
