import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SoundButton as SoundButtonType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import ActionSheet from './ActionSheet';

const SpeakerIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const PencilIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const GearIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

interface Props {
  button: SoundButtonType;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function SoundButton({ button, onDelete, onRename }: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newName, setNewName] = useState(button.name);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const play = useCallback(() => {
    if (playing) return;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }
    const url = URL.createObjectURL(button.audioBlob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    setPlaying(true);
    audio.play();
  }, [button.audioBlob, playing]);

  const clearTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlaying(false);
      setNewName(button.name);
      setMenuOpen(true);
    }, 600);
  }, [button.name]);

  const handlePointerUp = useCallback(() => {
    clearTimer();
    if (!didLongPress.current) {
      play();
    }
  }, [play]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    clearTimer();
    didLongPress.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    setNewName(button.name);
    setMenuOpen(true);
  }, [button.name]);

  const handleRename = useCallback(() => {
    setMenuOpen(false);
    setRenameOpen(true);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (newName.trim()) {
      onRename(button.id, newName.trim());
    }
    setRenameOpen(false);
  }, [button.id, newName, onRename]);

  const handleEdit = useCallback(() => {
    setMenuOpen(false);
    navigate('/add', { state: { editId: button.id } });
  }, [button.id, navigate]);

  const handleDelete = useCallback(() => {
    setMenuOpen(false);
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setDeleteOpen(false);
    onDelete(button.id);
  }, [button.id, onDelete]);

  const bgColor = button.buttonColor || '#5b8c5a';

  const actionItems = [
    { key: 'rename', label: t('rename'), icon: <PencilIcon />, onClick: handleRename },
    { key: 'edit', label: t('edit'), icon: <GearIcon />, onClick: handleEdit },
    { key: 'delete', label: t('delete'), icon: <TrashIcon />, danger: true, onClick: handleDelete },
  ];

  return (
    <div className="grid-btn-wrap">
      <button
        className={`circle-btn ${playing ? 'playing' : ''}`}
        style={{ backgroundColor: button.imageData ? 'transparent' : bgColor }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={clearTimer}
        onPointerLeave={clearTimer}
        onContextMenu={handleContextMenu}
        aria-label={button.name}
      >
        {button.imageData ? (
          <img src={button.imageData} alt="" className="circle-btn-img" />
        ) : (
          <span className="circle-btn-icon">
            <SpeakerIcon />
          </span>
        )}
        <span className="btn-title-overlay">
          <span className="btn-title-badge">{button.name}</span>
        </span>
        {playing && <span className="playing-ring" />}
      </button>

      {menuOpen && (
        <ActionSheet
          title={button.name}
          items={actionItems}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {renameOpen && (
        <div className="sheet-overlay" onClick={() => setRenameOpen(false)}>
          <div className="dialog glass-panel sheet-transition" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 320 }}>
            <h2 className="dialog-title">{t('renameTitle')}</h2>
            <input
              className="dialog-input"
              type="text"
              placeholder={t('renamePlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              maxLength={30}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); }}
            />
            <div className="dialog-actions">
              <button className="tb-btn btn-cancel" onClick={() => setRenameOpen(false)}>{t('cancel')}</button>
              <button className="tb-btn btn-primary" disabled={!newName.trim()} onClick={handleRenameSubmit}>{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="sheet-overlay" onClick={() => setDeleteOpen(false)}>
          <div className="dialog glass-panel sheet-transition" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 320 }}>
            <h2 className="dialog-title">{t('deleteThisButton')}</h2>
            <p className="dialog-message">"{button.name}" {t('deleteButtonMsg')}</p>
            <div className="dialog-actions">
              <button className="tb-btn btn-cancel" onClick={() => setDeleteOpen(false)}>{t('cancel')}</button>
              <button className="tb-btn btn-danger" onClick={handleDeleteConfirm}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
