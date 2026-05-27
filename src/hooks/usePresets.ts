import { useState, useEffect, useCallback } from 'react';
import type { SavedPreset } from '../types';
import { getAllPresets, savePreset, deletePreset } from '../db';

export function usePresets() {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getAllPresets();
    setPresets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(async (preset: SavedPreset) => {
    await savePreset(preset);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deletePreset(id);
    await refresh();
  }, [refresh]);

  return { presets, loading, save, remove, refresh };
}
