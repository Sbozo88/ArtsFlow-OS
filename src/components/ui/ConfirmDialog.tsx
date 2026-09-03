import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  /** Detailed description of what will happen. Avoid vague "Are you sure?" */
  description: string;
  /** Label for the confirm button. Default: 'Confirm' */
  confirmLabel?: string;
  /** Label for the cancel button. Default: 'Cancel' */
  cancelLabel?: string;
  /** Whether the confirm action is destructive */
  destructive?: boolean;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose>
      <div className="flex gap-4">
        {destructive && (
          <div className="shrink-0 w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? 'Processing…' : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
ConfirmDialog.displayName = 'ConfirmDialog';
