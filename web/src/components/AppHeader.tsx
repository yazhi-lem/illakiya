import type { AppView } from '../types';

type AppHeaderProps = {
  view: AppView;
  onChangeView: (view: AppView) => void;
};

export function AppHeader({ view, onChangeView }: AppHeaderProps) {
  return (
    <header className="topBar">
      <div className="brand">
        <span className="brandName">இலக்கியா</span>
        <span className="brandSub">Tamil Document Writer</span>
      </div>
      <nav className="viewSwitch" aria-label="View switcher">
        <button
          className={view === 'editor' ? 'active' : ''}
          onClick={() => onChangeView('editor')}
          aria-pressed={view === 'editor'}
        >
          எழுத்தாளர்
        </button>
        <button
          className={view === 'tutor' ? 'active' : ''}
          onClick={() => onChangeView('tutor')}
          aria-pressed={view === 'tutor'}
        >
          பயிற்சி
        </button>
      </nav>
    </header>
  );
}
