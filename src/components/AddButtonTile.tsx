import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function AddButtonTile() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="grid-btn-wrap">
      <button className="circle-btn add-circle-btn" onClick={() => navigate('/add')} aria-label={t('addButton')}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <span className="circle-btn-label">{t('addButton')}</span>
    </div>
  );
}
