import { useState, useEffect, useCallback } from 'react';
import type { SoundButton } from '../types';
import { getAllButtons, addButton, updateButton, deleteButton } from '../db';

export function useButtons() {
  const [buttons, setButtons] = useState<SoundButton[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getAllButtons();
    setButtons(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (btn: Omit<SoundButton, 'order' | 'createdAt'>) => {
    const existing = await getAllButtons();
    const newBtn: SoundButton = {
      ...btn,
      order: existing.length,
      createdAt: Date.now(),
    };
    await addButton(newBtn);
    await refresh();
    return newBtn;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteButton(id);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, partial: Partial<Omit<SoundButton, 'id' | 'order' | 'createdAt'>>) => {
    const existing = await getAllButtons();
    const btn = existing.find((b) => b.id === id);
    if (!btn) return;
    const updated: SoundButton = { ...btn, ...partial };
    await updateButton(updated);
    await refresh();
  }, [refresh]);

  return { buttons, loading, add, update, remove, refresh };
}
