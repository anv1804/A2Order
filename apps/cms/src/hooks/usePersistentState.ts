import { useState, useEffect } from "react";

export function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`a2order_${key}`);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn(`Lỗi đọc localStorage key "a2order_${key}":`, err);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`a2order_${key}`, JSON.stringify(state));
    } catch (err) {
      console.warn(`Lỗi ghi localStorage key "a2order_${key}":`, err);
    }
  }, [key, state]);

  return [state, setState];
}
