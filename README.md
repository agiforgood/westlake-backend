# 西湖区智能向善社会创新网络中心官网后端

这是西湖区智能向善社会创新网络中心官网的后端服务，基于现代化的技术栈构建。

## 技术栈

- **运行时/包管理器**: [Bun](https://bun.sh/)
- **Web 框架**: [Hono](https://hono.dev/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **数据库**: PostgreSQL
- **API 文档**: OpenAPI (Swagger)
- **验证**: Arktype
- **认证**: JWT (jose)
- **内容安全**: 阿里云内容安全服务

## 系统要求

- Bun 1.0.0 或更高版本
- PostgreSQL 14.0 或更高版本
- Docker 和 Docker Compose (可选，用于容器化部署)

## 安装

1. 克隆仓库：
```sh
git clone [repository-url]
cd westlake-backend
```

2. 安装依赖：
```sh
bun install
```

3. 配置环境变量：
创建 `.env` 文件并配置必要的环境变量（参考 `.env.example`）

## 开发

1. 启动开发服务器：
```sh
bun run dev
```

2. 数据库迁移：
```sh
bunx drizzle-kit push
```

3. 查看数据库：
```sh
bunx drizzle-kit studio
```

## 构建和部署

1. 构建项目：
```sh
bun run build
```

2. 使用 Docker 部署：
```sh
docker-compose up -d
```

## 项目结构

```
.
├── src/              # 源代码目录
├── drizzle/          # 数据库迁移文件
├── openapi.yaml      # OpenAPI 规范
├── docker-compose.yaml # Docker 配置
├── Dockerfile        # Docker 构建文件
└── drizzle.config.ts # Drizzle ORM 配置
```

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件
