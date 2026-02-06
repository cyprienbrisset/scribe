import { useState, useCallback, useEffect } from 'react';

interface HotkeyInputProps {
  value: string;
  onChange: (hotkey: string) => void;
  disabled?: boolean;
}

export function HotkeyInput({ value, onChange, disabled }: HotkeyInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<Set<string>>(new Set());

  const formatHotkey = useCallback((keys: Set<string>): string => {
    const modifiers: string[] = [];
    const regularKeys: string[] = [];

    keys.forEach((key) => {
      if (key === 'Control') modifiers.push('Ctrl');
      else if (key === 'Meta') modifiers.push('Cmd');
      else if (key === 'Alt') modifiers.push('Alt');
      else if (key === 'Shift') modifiers.push('Shift');
      else regularKeys.push(key.toUpperCase());
    });

    // Ordre standard: Ctrl, Alt, Shift, Cmd, puis la touche
    const orderedModifiers = ['Ctrl', 'Alt', 'Shift', 'Cmd'].filter(m => modifiers.includes(m));
    return [...orderedModifiers, ...regularKeys].join('+');
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    const key = e.key === ' ' ? 'Space' : e.key;

    setCurrentKeys((prev) => {
      const newKeys = new Set(prev);
      if (e.ctrlKey) newKeys.add('Control');
      if (e.metaKey) newKeys.add('Meta');
      if (e.altKey) newKeys.add('Alt');
      if (e.shiftKey) newKeys.add('Shift');

      // Ajouter la touche si ce n'est pas un modifier seul
      if (!['Control', 'Meta', 'Alt', 'Shift'].includes(key)) {
        newKeys.add(key);
      }

      return newKeys;
    });
  }, [isRecording]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    // Si on a au moins un modifier et une touche, sauvegarder
    const hasModifier = currentKeys.has('Control') || currentKeys.has('Meta') ||
                        currentKeys.has('Alt') || currentKeys.has('Shift');
    const hasKey = Array.from(currentKeys).some(k =>
      !['Control', 'Meta', 'Alt', 'Shift'].includes(k)
    );

    if (hasModifier && hasKey) {
      const formatted = formatHotkey(currentKeys);
      onChange(formatted);
      setIsRecording(false);
      setCurrentKeys(new Set());
    }
  }, [isRecording, currentKeys, formatHotkey, onChange]);

  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [isRecording, handleKeyDown, handleKeyUp]);

  const handleClick = () => {
    if (disabled) return;
    setIsRecording(true);
    setCurrentKeys(new Set());
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRecording(false);
    setCurrentKeys(new Set());
  };

  const displayValue = isRecording
    ? currentKeys.size > 0
      ? formatHotkey(currentKeys)
      : 'Appuyez sur les touches...'
    : value;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`w-full p-3 text-left rounded-xl bg-[rgba(255,255,255,0.08)] border transition-all ${
          isRecording
            ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]'
            : 'border-[var(--glass-border)] hover:border-[var(--glass-border-light)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center justify-between">
          <span className={`font-mono text-sm ${
            isRecording ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
          }`}>
            {displayValue}
          </span>
          {isRecording ? (
            <button
              onClick={handleCancel}
              className="text-[0.65rem] uppercase tracking-wider text-[var(--accent-danger)] hover:underline"
            >
              Annuler
            </button>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          )}
        </div>
      </button>
      {isRecording && (
        <p className="mt-1 text-[0.6rem] text-[var(--text-muted)] uppercase tracking-wider">
          Modifier + Touche requis (ex: Ctrl+Shift+R)
        </p>
      )}
    </div>
  );
}
