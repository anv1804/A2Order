import React from "react";
import { ToastContainer } from "./ToastContainer";
import { ConfirmDialog } from "./ConfirmDialog";

export const GlobalFeedback: React.FC = () => {
  return (
    <>
      <ToastContainer />
      <ConfirmDialog />
    </>
  );
};
