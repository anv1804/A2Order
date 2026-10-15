import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PortalProps } from "@/types";

export const Portal: React.FC<PortalProps> = ({ children }) => {

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
};
