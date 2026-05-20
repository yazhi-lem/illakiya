import type { AppView } from '../types';

type AppHeaderProps = {
  view: AppView;
  onChangeView: (view: AppView) => void;
};

export function AppHeader({ view, onChangeView }: AppHeaderProps) {
  return (
    <header className="topBar">
      <h1>🎵 இலக்கியா V2</h1>
      <div className="viewSwitch">
        <button className={view === 'editor' ? 'active' : ''} onClick={() => onChangeView('editor')}>
          PM0100 திருத்தி
        </button>
        <button className={view === 'tutor' ? 'active' : ''} onClick={() => onChangeView('tutor')}>
          தட்டச்சு பயிற்சி
        </button>
      </div>
    </header>
  );
}
