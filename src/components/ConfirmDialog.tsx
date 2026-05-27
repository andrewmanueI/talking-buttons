import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  title, message, confirmLabel, cancelLabel,
  onConfirm, onCancel, danger = false,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className="sheet-overlay" onClick={onCancel}>
      <div className="dialog glass-panel sheet-transition" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">{title}</h2>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button className="tb-btn btn-cancel" onClick={onCancel}>{cancelLabel || t('cancel')}</button>
          <button className={`tb-btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel || t('save')}</button>
        </div>
      </div>
    </div>
  );
}
