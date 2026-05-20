# Web Application Layout & Architecture

The Illakiya web application is built on React + Vite. The core application logic and UI are defined in `web/src/`.

## Overall App layout
The main entry point (`App.tsx`) renders the `appShell` containing fixed components like `.topBar` (`AppHeader`) and swappable main content layout components depending on view context (`TutorPane` vs `EditorLayout`).

When the primary typing interface is visible, the UI enters its "withKeyboard" configuration.

### CSS Grid `withKeyboard` Topology
Using CSS Grid (`.editorLayout.withKeyboard`), the layout creates a dual-layer interface focused around writing context and the on-screen phonetic Tamil keyboard.

```css
.editorLayout.withKeyboard {
  display: grid;
  grid-template-columns: minmax(220px, 300px) 1fr;
  grid-template-rows: 1fr 20vh;
  gap: 10px;
  grid-template-areas:
    "notes editor"
    "keyboard keyboard";
}
```

This arrangement assigns these areas to UI responsibilities:

1.  **Sidebar (`grid-area: notes`)**: Notes list, switching between documents, note creation. Positioned on the top-left layer.
2.  **Editor (`grid-area: editor`)**: Active markdown content rendering textarea (`markdownEditor`). Occupies top-right expanding over the available row space.
3.  **Keyboard (`grid-area: keyboard`)**: The functional PM0100 soft keyboard structure spanning down horizontally across the bottom `20vh` using `keyboardPanel attached`.

```text
 ┌─────────────────┬──────────────────────────────────────────┐
 │ Sidebar / Notes │                                          │
 │ (Top Left)      │              EditorPane                  │
 │                 │              (Top Right/Main)            │
 ├─────────────────┴──────────────────────────────────────────┤
 │                                                            │
 │                  KeyboardDock                              │
 │                  (Bottom fixed area, 20vh)                 │
 └────────────────────────────────────────────────────────────┘
```

## Accessibility Features

The `KeyboardDock` has been enhanced for multi-modal operation specifically aimed at screen-reader support. 

- **Focus Navigation**: Arrow key handlers loop between key buttons utilizing specific React References.
- **ARIA Labeling**: Keys are marked correctly with semantic roles `row`, `toolbar`.
- **Keyboard Instructs**: `.sr-only` class hides text meant only for assistive-device announcements, attached seamlessly to UI objects via `aria-describedby`.
- **Visuals**: Uses explicitly configured `.keyboardRow button:focus-visible` parameters mapped to a 3px `#f6b042` emphasis ring ensuring compliant standard visual contrasts.

## Optimizations
CSS rules in `styles.css` are heavily refactored down using `clean-css-cli` into a production-lite footprint found in `styles.min.css`. The application root entry is modified (`main.tsx`) to pull this source by default.