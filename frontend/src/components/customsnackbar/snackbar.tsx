import React from "react";
import Snackbar from "@mui/material/Snackbar";
import { useRecoilState } from "recoil";
import { alertState, alertTextState, alertTypeState } from "../../states/state";

const CustomSnackbar = () => {
  const [open, setOpen] = useRecoilState(alertState);
  const [text] = useRecoilState(alertTextState);
  const [type] = useRecoilState(alertTypeState); // "success", "error", "info", "warning"

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  const getBackgroundColor = (type: string) => {
    let color= "#333"; // Default color
    switch (type) {
      case "success":
        color= "#4caf50";
        break;
      case "error":
        color= "#f44336";
        break;
      case "warning":
        color= "#ff9800";
        break;
      case "info":
        color="#2196f3";
        break;
      default:
        color="#333";
        break; // Default color for unknown types
    }
    return color;
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      message={
        <span
          style={{
            width:"100%",
            backgroundColor: getBackgroundColor(type),
            padding: "8px 16px",
            borderRadius: 4,
            color: "#fff",
            fontWeight: 500,
            display: "inline-block",
          }}
        >
          {text}
        </span>
      }
    />
  );
};

export default CustomSnackbar;
