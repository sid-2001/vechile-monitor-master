import React from "react";
import Snackbar from "@mui/material/Snackbar";
import { useRecoilState } from "recoil";
import axios from "axios";
import { alertState, alertTextState, alertTypeState } from "../../states/state";
import { useEffect } from "react";
//@ts-ignore
const { VITE_APP_BACKEND } = import.meta.env

const CustomSnackbar = () => {
  const currentSOSId = localStorage.getItem("currentSOSId");
  const [open, setOpen] = useRecoilState(alertState);
  const [text] = useRecoilState(alertTextState);
  const [type] = useRecoilState(alertTypeState); // "success", "error", "info", "warning"


  useEffect(() => {
  if (!open) return;

  // only non-SOS auto hide
  if (type !== "sos") {
    const timer = setTimeout(() => {
      setOpen(false);
    }, 2000);

    return () => clearTimeout(timer);
  }
}, [open, text, type]);

 const handleClose = async (
  _event?: React.SyntheticEvent | Event,
  reason?: string
) => {
  if (reason === "clickaway") return;

  if (type !== "sos") {
    setOpen(false);
    return;
  }



  try {
    if (currentSOSId) {
      await axios.put(
        `${VITE_APP_BACKEND}/api/sos/close/${currentSOSId}`,
        {},
        {
          headers: {
           Authorization: `Bearer ${JSON.parse(localStorage.getItem("access_token") || "")}`
          },
        }
      );
      console.log("✅ SOS closed API called");
    }
  } catch (error) {
    console.error("❌ Error closing SOS:", error);
  }

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
      key={text}
      open={open}
      autoHideDuration={2000}
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
