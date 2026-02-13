import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Snippet } from '../../types';

export function SnippetsSection() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSnippets = useCallback(async () => {
    try {
      const data = await invoke<Snippet[]>('get_snippets');
      setSnippets(data);
    } catch (e) {
      console.error('Failed to load snippets:', e);
    }
  }, []);

  useEffect(() => { loadSnippets(); }, [loadSnippets]);

  const handleAdd = async () => {
    if (!name.trim() || !trigger.trim() || !content.trim()) return;
    const snippet: Snippet = {
      id: Date.now().toString(),
      name: name.trim(),
      trigger: trigger.trim().toLowerCase(),
      content: content.trim(),
    };
    try {
      if (editingId) {
        await invoke('update_snippet', { id: editingId, snippet });
        setEditingId(null);
      } else {
        await invoke('add_snippet', { snippet });
      }
      setName('');
      setTrigger('');
      setContent('');
      loadSnippets();
    } catch (e) {
      console.error('Failed to save snippet:', e);
    }
  };

  const handleEdit = (s: Snippet) => {
    setEditingId(s.id);
    setName(s.name);
    setTrigger(s.trigger);
    setContent(s.content);
  };

  const handleRemove = async (id: string) => {
    try {
      await invoke('remove_snippet', { id });
      loadSnippets();
    } catch (e) {
      console.error('Failed to remove snippet:', e);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setTrigger('');
    setContent('');
  };

  return (
    <section className="space-y-4">
      <h3 className="section-title secondary">Snippets vocaux</h3>
      <p className="text-[0.75rem] text-[var(--text-muted)]">
        Dites "insere [declencheur]" pour inserer un snippet.
      </p>

      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du snippet"
          className="input-glass w-full"
        />
        <input
          type="text"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          placeholder="Mot declencheur (ex: signature)"
          className="input-glass w-full"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenu a inserer..."
          rows={3}
          className="input-glass w-full resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !trigger.trim() || !content.trim()}
            className="btn-glass px-4 text-[var(--accent-primary)] disabled:opacity-50"
          >
            {editingId ? 'Modifier' : 'Ajouter'}
          </button>
          {editingId && (
            <button onClick={handleCancel} className="btn-glass px-4 text-[var(--text-muted)]">
              Annuler
            </button>
          )}
        </div>
      </div>

      {snippets.length > 0 && (
        <div className="space-y-2">
          {snippets.map((s) => (
            <div key={s.id} className="glass-card p-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[0.875rem] font-medium text-[var(--text-primary)]">{s.name}</span>
                  <span className="tag-frost text-[0.65rem]">{s.trigger}</span>
                </div>
                <p className="text-[0.75rem] text-[var(--text-muted)] truncate">{s.content}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(s)}
                  className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleRemove(s.id)}
                  className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
