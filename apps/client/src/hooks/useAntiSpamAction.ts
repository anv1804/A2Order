import { useState, useRef } from "react";
import { generateIdempotencyKey } from "@/lib/idempotency";
import { toast } from "@/stores/notificationStore";

export function useAntiSpamAction<T, R>(
  actionPrefix: string,
  actionFn: (payload: T, idempotencyKey: string) => Promise<R>,
  cooldownMs: number = 800
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastExecutionTime = useRef<number>(0);

  const execute = async (payload: T): Promise<R | null> => {
    const now = Date.now();
    if (now - lastExecutionTime.current < cooldownMs) {
      toast.warning("Thao tác quá nhanh, vui lòng đợi một chút!");
      return null;
    }

    if (isSubmitting) return null;

    lastExecutionTime.current = now;
    setIsSubmitting(true);

    try {
      const key = generateIdempotencyKey(actionPrefix);
      const result = await actionFn(payload, key);
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { execute, isSubmitting };
}
