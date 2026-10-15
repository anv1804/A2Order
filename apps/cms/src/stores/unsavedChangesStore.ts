import { useEffect } from "react";
import { create } from "zustand";
import { UnsavedChangesState } from "@/types";


export const useUnsavedChangesStore = create<UnsavedChangesState>((set) => ({
  dirtySources: {},
  setDirty: (source, dirty) => set((state) => {
    const next = { ...state.dirtySources };
    if (dirty) next[source] = true;
    else delete next[source];
    return { dirtySources: next };
  }),
  clearAll: () => set({ dirtySources: {} }),
}));

export const hasUnsavedChanges = () => Object.keys(useUnsavedChangesStore.getState().dirtySources).length > 0;

export const useUnsavedChanges = (source: string, dirty: boolean) => {
  useEffect(() => {
    useUnsavedChangesStore.getState().setDirty(source, dirty);
    return () => useUnsavedChangesStore.getState().setDirty(source, false);
  }, [source, dirty]);
};
