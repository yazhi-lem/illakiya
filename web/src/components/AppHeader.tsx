import type { AppView } from '../types';

type AppHeaderProps = {
  view: AppView;
  onChangeView: (view: AppView) => void;
  backend?: 'wasm' | 'ts';
};

export function AppHeader({ view, onChangeView, backend }: AppHeaderProps) {
  return (
    <header className="topBar">
      <h1>
        📖 இலக்கியா <span className="brandSub">— தமிழ் நூல் திருத்தி</span>
        {backend === 'wasm' ? <span className="engineBadge" title="Rust WASM engine active">🦀</span> : null}
      </h1>
      <div className="viewSwitch">
        <button className={view === 'editor' ? 'active' : ''} onClick={() => onChangeView('editor')}>
          நூல் திருத்தி
        </button>
        <button className={view === 'tutor' ? 'active' : ''} onClick={() => onChangeView('tutor')}>
          தட்டச்சு பயிற்சி
        </button>
      </div>
    </header>
  );
}
