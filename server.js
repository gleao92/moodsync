const express = require("express");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PORT          = process.env.PORT || 3001;
const BASE_URL      = process.env.BASE_URL || `http://localhost:${PORT}`;
const REDIRECT_URI  = `${BASE_URL}/callback`;

const PLAYLISTS = {
  energético: "spotify:playlist:37i9dQZF1DX3rxVfibe1L0",
  calmo:      "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO",
  focado:     "spotify:playlist:37i9dQZF1DWZeKCadgRdKQ",
  ansioso:    "spotify:playlist:37i9dQZF1DX3Ogo9pFvBkY",
  triste:     "spotify:playlist:37i9dQZF1DX7qK8ma5wgG1",
  animado:    "spotify:playlist:37i9dQZF1DX0HRj9P7NxeE",
};

// Serve o app HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Login Spotify
app.get("/login", (req, res) => {
  const scopes = "user-modify-playback-state playlist-read-private streaming";
  const url = `https://accounts.spotify.com/authorize?response_type=code`
    + `&client_id=${CLIENT_ID}`
    + `&scope=${encodeURIComponent(scopes)}`
    + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(url);
});

// Callback do Spotify
app.get("/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { data } = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
      { headers: {
          Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
      }}
    );
    // Redireciona pro app com o token na URL
    res.redirect(`/?token=${data.access_token}`);
  } catch (err) {
    res.status(500).send("Erro ao autenticar com Spotify: " + err.message);
  }
});

// Tocar playlist pelo humor
app.post("/api/play", async (req, res) => {
  const { mood, token } = req.body;
  if (!mood || !token) return res.status(400).json({ error: "mood e token são obrigatórios" });

  const uri = PLAYLISTS[mood];
  if (!uri) return res.status(400).json({ error: "Humor inválido" });

  try {
    await axios.put(
      "https://api.spotify.com/v1/me/player/play",
      { context_uri: uri },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.json({ success: true, playlist: uri });
  } catch (err) {
    res.status(500).json({ error: "Erro ao tocar playlist", detail: err.response?.data });
  }
});

app.listen(PORT, () => console.log(`MoodSync rodando na porta ${PORT}`));
