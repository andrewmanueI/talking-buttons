import type { ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface ActionItem {
  key: string;
  label: string;
  icon: ReactNode;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  title?: string;
  items: ActionItem[];
  onClose: () => void;
}

export default function ActionSheet({ title, items, onClose }: Props) {
  const { t } = useLanguage();

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet sheet-transition" onClick={(e) => e.stopPropagation()}>
        {title && <div className="sheet-title">{title}</div>}
        {items.map((item) => (
          <button
            key={item.key}
            className={`sheet-item ${item.danger ? 'sheet-item-danger' : ''}`}
            onClick={item.onClick}
          >
            <span className="sheet-item-icon">{item.icon}</span>
            <span className="sheet-item-label">{item.label}</span>
          </button>
        ))}
        <button className="sheet-cancel" onClick={onClose}>{t('cancel')}</button>
      </div>
    </div>
  );
}
