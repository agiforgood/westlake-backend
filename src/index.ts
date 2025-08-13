import { Hono } from "hono"
import { cors } from "hono/cors"
import profile from "./route/profile"
import admin from "./route/admin"
import chat from "./route/chat"
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
app.route("/api/chat", chat)

const port = parseInt(process.env.PORT || "3000")
const idleTimeout = parseInt(process.env.IDLE_TIMEOUT || "60")
const maxRequestBodySize = parseInt(process.env.MAX_REQUEST_BODY_SIZE || "52428800")

console.log(`Server configuration:`)
console.log(`- Port: ${port}`)
console.log(`- Idle timeout: ${idleTimeout} seconds`)
console.log(`- Max request body size: ${maxRequestBodySize / 1024 / 1024} MB`)

// 导出配置对象而不是 app，让 Bun 自动启动服务器
export default {
  port,
  fetch: app.fetch,
  idleTimeout,
  maxRequestBodySize,
}