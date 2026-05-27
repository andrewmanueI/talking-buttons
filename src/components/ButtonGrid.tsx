import type { SoundButton as SoundButtonType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import SoundButton from './SoundButton';
import AddButtonTile from './AddButtonTile';
import EmptyState from './EmptyState';

interface Props {
  buttons: SoundButtonType[];
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function ButtonGrid({ buttons, onDelete, onRename }: Props) {
  const { t } = useLanguage();

  if (buttons.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.35">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        }
        title={t('noButtons')}
        message={t('noButtonsMsg')}
        action={<AddButtonTile />}
      />
    );
  }

  return (
    <div className="button-grid">
      {buttons.map((btn) => (
        <SoundButton key={btn.id} button={btn} onDelete={onDelete} onRename={onRename} />
      ))}
      <AddButtonTile />
    </div>
  );
}
