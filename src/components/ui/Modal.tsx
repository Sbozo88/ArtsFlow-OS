import * as React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Maximum width of the modal. Default: 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Hide the close (X) button */
  hideClose?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  hideClose = false,
  className,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap: return focus to previously focused element on close
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the modal content
      requestAnimationFrame(() => {
        contentRef.current?.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Close on overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          'bg-white rounded-2xl shadow-xl w-full outline-none animate-in zoom-in-95 duration-200',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between p-6 pb-0">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-slate-500">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors -mt-1 -mr-1"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
Modal.displayName = 'Modal';

// ── Modal Footer (convenience) ────────────────────────────────────────────────

export type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const ModalFooter: React.FC<ModalFooterProps> = ({ className, children, ...props }) => (
  <div
    className={cn('flex items-center justify-end gap-3 pt-4 border-t border-slate-100 -mx-6 -mb-6 px-6 py-4', className)}
    {...props}
  >
    {children}
  </div>
);
ModalFooter.displayName = 'ModalFooter';
