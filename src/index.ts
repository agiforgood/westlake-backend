import { Hono } from "hono"
import { cors } from "hono/cors"
import profile from "./route/profile"
import admin from "./route/admin"
import { authMiddleware } from "./middleware/auth"

const app = new Hono<{
  Variables: {
    user: {
      id: string,
    } | null,
  }
}>();

if (process.env.NODE_ENV !== "production") {
  app.use("*", cors({
    origin: "http://localhost:3001", // replace with your origin
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }));
}

app.use("*", authMiddleware);

app.route("/api/admin", admin)
app.route("/api/profile", profile)


export default app