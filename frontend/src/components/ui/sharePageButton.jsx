import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Typography
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { API_URL } from "../../config";

function SharePageButton({ token, pageId }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [giveWrite, setGiveWrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [publicLink, setPublicLink] = useState("");

  const handleOpen = () => {
    setOpen(true);
    setEmail("");
    setGiveWrite(false);
    setMessage("");
    setPublicLink("");
  };

  const handleClose = () => {
    setOpen(false);
    setMessage("");
    setPublicLink(""); 
  };

  // Share via email
  const handleShareEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/pages/sharepage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          pageId,
          userEmail: email,
          giveWritePermission: giveWrite,
        }),
      });

      const data = await res.json();
      setMessage(data.message || "Shared via email!");
    } catch {
      setMessage("Error sharing via email.");
    }

    setLoading(false);
  };

  // Share public link
  const handleShareLink = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/pages/publicshare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });

      const data = await res.json();

      if (data.publicShareId) {
        setPublicLink(`${API_URL}/api/pages/share/`+data.publicShareId);   
      }
      setMessage(data.message || "Public link generated!");
    } catch {
      setMessage("Error generating public link.");
    }

    setLoading(false);
  };

  const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(publicLink);
    setMessage("Link copied to clipboard!");
  } catch {
    setMessage("Failed to copy link.");
  }
};

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ShareIcon />}
        onClick={handleOpen}
        sx={{ ml: 1 }}
      >
        Share
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Share Page</DialogTitle>

        <DialogContent>
          <form onSubmit={handleShareEmail}>
            <TextField
              label="User Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={giveWrite}
                  onChange={(e) => setGiveWrite(e.target.checked)}
                />
              }
              label="Give edit permission"
            />

            {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
            {message && (
              <Typography
                color={message.includes("Error") ? "error" : "primary"}
                sx={{ mt: 1 }}
              >
                {message}
              </Typography>
            )}

            <DialogActions>
              <Button onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                Share via Email
              </Button>
              <Button
                type="button"
                variant="contained"
                onClick={handleShareLink}
                disabled={loading}
              >
                Share Public Link
              </Button>
              {publicLink && (
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyLink}
                    disabled={loading}
                  ></Button>
                )}
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SharePageButton;
