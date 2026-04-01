import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Box
} from "@mui/material"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import { useEffect, useState } from "react"

interface Props {
  open: boolean
  onStay: () => void
  onLogout: () => void
}

export default function InactivityWarningModal({
  open,
  onStay,
  onLogout
}: Props) {
  const [seconds, setSeconds] = useState(30)

  useEffect(() => {
    if (!open) return

    setSeconds(30)

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open])

  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: 4,
          maxWidth: 520,
          textAlign: "center"
        }
      }}
    >
      <DialogContent>

        {/* Warning Icon */}
        <Box
          display="flex"
          justifyContent="center"
          mb={2}
        >
          <WarningAmberIcon
            sx={{
              fontSize: 90,
              color: "#f5a623"
            }}
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
        >
          Session about to be expired
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          For security reasons, your session will end in{" "}
          <b>{seconds} seconds</b> due to inactivity. Click below to stay
          signed in.
        </Typography>

        {/* Button */}
        <Button
          variant="contained"
          onClick={onStay}
          sx={{
            px: 3,
            py: 1,
            textTransform: "none",
            borderRadius: "6px"
          }}
        >
          Stay Signed In
        </Button>

      </DialogContent>
    </Dialog>
  )
}