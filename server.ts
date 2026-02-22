import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("berrystack.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT,
    file_name TEXT,
    github_url TEXT,
    deploy_type TEXT DEFAULT 'code',
    status TEXT DEFAULT 'stopped',
    env_vars TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_run DATETIME,
    port INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(app_id) REFERENCES apps(id)
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/apps", (req, res) => {
    const apps = db.prepare("SELECT * FROM apps ORDER BY created_at DESC").all();
    res.json(apps.map((a: any) => ({ ...a, env_vars: JSON.parse(a.env_vars || '{}') })));
  });

  app.get("/api/apps/:id/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM logs WHERE app_id = ? ORDER BY timestamp DESC LIMIT 50").all(req.params.id);
    res.json(logs);
  });

  app.get("/api/system/stats", (req, res) => {
    // Generate some interesting historical data for the charts
    const stats = Array.from({ length: 20 }).map((_, i) => ({
      time: new Date(Date.now() - (19 - i) * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cpu: Math.floor(Math.random() * 30) + 10,
      ram: Math.floor(Math.random() * 20) + 40,
    }));
    res.json(stats);
  });

  app.post("/api/apps", (req, res) => {
    const { name, code, file_name, github_url, deploy_type, env_vars } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const info = db.prepare(`
      INSERT INTO apps (name, code, file_name, github_url, deploy_type, env_vars) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, code || null, file_name || null, github_url || null, deploy_type || 'code', JSON.stringify(env_vars || {}));
    
    const newApp = db.prepare("SELECT * FROM apps WHERE id = ?").get(info.lastInsertRowid);
    res.json(newApp);
  });

  app.delete("/api/apps/:id", (req, res) => {
    db.prepare("DELETE FROM apps WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/apps/:id/toggle", (req, res) => {
    const appData = db.prepare("SELECT * FROM apps WHERE id = ?").get(req.params.id) as any;
    if (!appData) return res.status(404).json({ error: "App not found" });

    const newStatus = appData.status === "running" ? "stopped" : "running";
    const lastRun = newStatus === "running" ? new Date().toISOString() : appData.last_run;
    
    db.prepare("UPDATE apps SET status = ?, last_run = ? WHERE id = ?").run(newStatus, lastRun, req.params.id);
    
    res.json({ ...appData, status: newStatus, last_run: lastRun });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BerryStack running on http://localhost:${PORT}`);
  });
}

startServer();
