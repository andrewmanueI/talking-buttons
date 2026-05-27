interface Props {
  name: string;
  imageData: string | null;
  buttonColor: string;
}

const SpeakerIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export default function ButtonPreview({ name, imageData, buttonColor }: Props) {
  return (
    <div className="preview-section">
      <div className="preview-label">Preview</div>
      <div className="preview-circle-wrap">
        <div
          className="preview-circle"
          style={{ backgroundColor: imageData ? 'transparent' : buttonColor }}
        >
          {imageData ? (
            <img src={imageData} alt="" className="preview-circle-img" />
          ) : (
            <span className="preview-circle-icon">
              <SpeakerIcon />
            </span>
          )}
          <span className="btn-title-overlay">
            <span className="btn-title-badge">{name}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
