interface Props {
  name: string;
  buttonCount: number;
  date: string;
  onLoad: () => void;
  onDelete: () => void;
}

export default function PresetCard({ name, buttonCount, date, onLoad, onDelete }: Props) {
  return (
    <div className="preset-card">
      <div className="preset-card-info">
        <div className="preset-card-name">{name}</div>
        <div className="preset-card-meta">
          {buttonCount} button{buttonCount !== 1 ? 's' : ''} &middot; {date}
        </div>
      </div>
      <div className="preset-card-actions">
        <button className="tb-btn btn-secondary btn-sm" onClick={onLoad}>Load</button>
        <button className="tb-btn btn-secondary btn-sm btn-icon-only" onClick={onDelete} aria-label="Delete preset">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
