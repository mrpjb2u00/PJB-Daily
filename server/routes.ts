import type { Express } from "express";
import { createServer, type Server } from "node:http";
import QRCode from "qrcode";

function getExpoUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS;
  if (domain) {
    return `exp://${domain}`;
  }
  return "exp://localhost:8081";
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/expo-qr", async (req, res) => {
    const expoUrl = getExpoUrl();
    try {
      const qrDataUrl = await QRCode.toDataURL(expoUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });

      res.set("Content-Type", "text/html");
      res.set("Cache-Control", "no-cache");
      res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Open in Expo Go</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 24px; text-align: center; }
    h2 { color: #333; margin-bottom: 4px; }
    p { color: #666; font-size: 14px; margin: 8px 0 24px; }
    img { border: 8px solid white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .btn { display: inline-block; margin-top: 28px; padding: 16px 32px; background: #4630EB; color: white;
           text-decoration: none; border-radius: 12px; font-size: 17px; font-weight: 600; }
    .url { margin-top: 20px; font-size: 12px; color: #999; word-break: break-all; }
  </style>
</head>
<body>
  <h2>To-Dos &amp; Notes</h2>
  <p>Scan with your Camera app, or tap the button below on your phone.</p>
  <img src="${qrDataUrl}" width="300" height="300" alt="Expo QR Code"/>
  <br/>
  <a class="btn" href="${expoUrl}">Open in Expo Go</a>
  <div class="url">${expoUrl}</div>
</body>
</html>`);
    } catch (e) {
      res.status(500).send("Failed to generate QR code");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
