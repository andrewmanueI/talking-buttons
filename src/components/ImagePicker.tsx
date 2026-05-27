import { useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  imageData: string | null;
  onImageSelected: (dataUrl: string | null) => void;
}

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImagePicker({ imageData, onImageSelected }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await resizeImage(file, 400);
      onImageSelected(dataUrl);
    }
  };

  if (imageData) {
    return (
      <div className="image-picker-section">
        <div className="image-picker-label">{t('imageSelected')}</div>
        <div className="image-circle-preview">
          <img src={imageData} alt="Preview" />
        </div>
        <div className="image-picker-actions">
          <button className="tb-btn btn-secondary" onClick={() => onImageSelected(null)}>{t('removeImage')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="image-picker-section">
      <div className="image-picker-label">{t('imageOptional')}</div>
      <div className="image-picker-actions">
        <button className="tb-btn btn-secondary" onClick={() => cameraRef.current?.click()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          {t('takePhoto')}
        </button>
        <button className="tb-btn btn-secondary" onClick={() => fileRef.current?.click()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {t('chooseImage')}
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
}
