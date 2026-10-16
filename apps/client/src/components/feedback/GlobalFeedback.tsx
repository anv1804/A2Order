import React from "react";
import { ToastContainer } from "./ToastContainer";
import { ConfirmDialog } from "./ConfirmDialog";
import { NetworkStatusBanner } from "./NetworkStatusBanner";

export const GlobalFeedback: React.FC = () => {
  return (
    <>
      <NetworkStatusBanner />
      <ToastContainer />
      <ConfirmDialog />
    </>
  );
};
