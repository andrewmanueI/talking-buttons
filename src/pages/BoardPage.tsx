import { useCallback } from 'react';
import { useButtons } from '../hooks/useButtons';
import { useLanguage } from '../i18n/LanguageContext';
import AnimatedScreen from '../components/motion/AnimatedScreen';
import ButtonGrid from '../components/ButtonGrid';

export default function BoardPage() {
  const { buttons, loading, update, remove } = useButtons();
  const { t } = useLanguage();

  const handleRename = useCallback(async (id: string, name: string) => {
    await update(id, { name });
  }, [update]);

  if (loading) {
    return (
      <AnimatedScreen>
        <main className="page"><p className="loading">{t('loading')}</p></main>
      </AnimatedScreen>
    );
  }

  return (
    <AnimatedScreen>
      <main className="page board-page">
        <ButtonGrid buttons={buttons} onDelete={remove} onRename={handleRename} />
      </main>
    </AnimatedScreen>
  );
}
