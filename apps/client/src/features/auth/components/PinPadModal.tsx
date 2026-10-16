import React from "react";
import { PinPadModalProps } from "@/types";
import { UnifiedAuthModal } from "./UnifiedAuthModal";

export const PinPadModal: React.FC<PinPadModalProps> = ({ isOpen, onPinSubmit, onClose }) => (
  <UnifiedAuthModal
    isOpen={isOpen}
    staffList={[]}
    onPinSubmit={onPinSubmit}
    onClose={onClose || (() => undefined)}
  />
);
