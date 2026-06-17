import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage } from 'node:http'
import { getUserDirname } from '@/user'
import { startupLog } from './log4js'

/**
 * 用户活跃时间追踪
 * - 内存 + 磁盘 users.json 维护 lastActiveAt
 * - 写盘采用防抖以减少 IO
 */

const lastActiveAtCache = new Map<string, number>()
const writeDebounceTimers = new Map<string, NodeJS.Timeout>()
const WRITE_DEBOUNCE_MS = 5000

function getUsersJsonPath() {
  return path.join(global.lx.dataPath, 'users.json')
}

function getOrCreateUserActivePath() {
  // 记录每个用户最近一次活跃时间的辅助文件 (防止热加载丢失)
  return path.join(global.lx.dataPath, 'userActivity.json')
}

function loadUserActivityFromDisk(): void {
  const file = getOrCreateUserActivePath()
  if (!fs.existsSync(file)) return
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
    if (data && typeof data === 'object') {
      for (const [name, ts] of Object.entries(data)) {
        if (typeof ts === 'number') lastActiveAtCache.set(name, ts)
      }
    }
  } catch (e) {
    startupLog.warn('Failed to load userActivity.json:', (e as Error).message)
  }
}

loadUserActivityFromDisk()

/** 同步 users.json 中用户的 lastActiveAt 字段（防抖） */
export function touchUserActivity(username: string): void {
  if (!username) return
  const now = Date.now()
  const prev = lastActiveAtCache.get(username) || 0
  // 5 分钟内重复写无意义，直接跳过
  if (now - prev < 5 * 1000 && prev !== 0) return
  lastActiveAtCache.set(username, now)

  // 同步更新内存中的 users
  const user = global.lx.config.users.find(u => u.name === username)
  if (user) (user as any).lastActiveAt = now

  // 同步更新磁盘 activity 文件
  if (writeDebounceTimers.has(username)) clearTimeout(writeDebounceTimers.get(username)!)
  writeDebounceTimers.set(
    username,
    setTimeout(() => {
      writeDebounceTimers.delete(username)
      const file = getOrCreateUserActivePath()
      try {
        const data: Record<string, number> = {}
        for (const [k, v] of lastActiveAtCache.entries()) data[k] = v
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
      } catch (e) {
        startupLog.warn('Failed to persist userActivity.json:', (e as Error).message)
      }
    }, WRITE_DEBOUNCE_MS),
  )
}

/** 启动时把磁盘 activity 合并到内存 user.lastActiveAt */
export function mergeUserActivityToConfig(): void {
  for (const user of global.lx.config.users) {
    const ts = lastActiveAtCache.get(user.name)
    if (ts) (user as any).lastActiveAt = ts
    if (!(user as any).createdAt) (user as any).createdAt = Date.now()
    if (!(user as any).role) {
      // 首个用户自动设为管理员
      const adminUser = global.lx.config.users.find(u => (u as any).role === 'admin')
      ;(user as any).role = adminUser ? 'user' : 'admin'
    }
  }
  // 确保至少有一个 admin
  if (!global.lx.config.users.some(u => (u as any).role === 'admin')) {
    if (global.lx.config.users[0]) (global.lx.config.users[0] as any).role = 'admin'
  }
}

/** 获取所有用户活跃时间 */
export function getAllUserActivity(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of lastActiveAtCache.entries()) out[k] = v
  return out
}

// ============== 鉴权 ==============

export interface AuthContext {
  /** 已认证的用户名，未登录则为 null */
  username: string | null
  /** 是否为管理员 */
  isAdmin: boolean
  /** 是否处于管理员密码模式（已通过 x-frontend-auth） */
  isAdminAuth: boolean
}

const ADMIN_USERS = new Set<string>()
export function refreshAdminSet() {
  ADMIN_USERS.clear()
  for (const u of global.lx.config.users) {
    if ((u as any).role === 'admin') ADMIN_USERS.add(u.name)
  }
}
refreshAdminSet()

/** 当前请求是否通过管理员密码 (x-frontend-auth) 完成认证 */
export function isAdminPasswordAuth(req: IncomingMessage): boolean {
  const auth = req.headers['x-frontend-auth']
  if (!auth) return false
  if (typeof auth !== 'string') return false
  return auth === global.lx.config['frontend.password']
}

/** 解析用户 Token（与 server.ts 中的 userSessions / persistentTokens 保持一致） */
export interface UserTokenResolver {
  resolveUserToken: (req: IncomingMessage) => string | null
}

let _resolver: UserTokenResolver | null = null
export function registerUserTokenResolver(r: UserTokenResolver) {
  _resolver = r
}

/**
 * 通用鉴权：依次检查
 * 1. x-frontend-auth (管理员密码)
 * 2. x-user-token (用户 Token)
 * 3. x-user-name + x-user-password (兼容旧客户端；密码明文)
 */
export function resolveAuth(req: IncomingMessage): AuthContext {
  if (!global.lx.config.users || global.lx.config.users.length === 0) {
    return { username: null, isAdmin: false, isAdminAuth: false }
  }

  // 1) 管理员密码
  if (isAdminPasswordAuth(req)) {
    // 默认以第一个 admin 身份
    const adminName = global.lx.config.users.find(u => (u as any).role === 'admin')?.name
      || global.lx.config.users[0]?.name
      || null
    if (adminName) touchUserActivity(adminName)
    return { username: adminName, isAdmin: true, isAdminAuth: true }
  }

  // 2) 用户 Token
  if (_resolver) {
    const tokenName = _resolver.resolveUserToken(req)
    if (tokenName) {
      const u = global.lx.config.users.find(usr => usr.name === tokenName)
      if (u && !(u as any).disabled) {
        touchUserActivity(tokenName)
        const isAdmin = (u as any).role === 'admin' || ADMIN_USERS.has(tokenName)
        return { username: tokenName, isAdmin, isAdminAuth: false }
      }
    }
  }

  // 3) 明文用户名密码 (兼容旧客户端)
  const u = req.headers['x-user-name']
  const p = req.headers['x-user-password']
  if (typeof u === 'string' && typeof p === 'string' && u && p) {
    const user = global.lx.config.users.find(usr => usr.name === u && usr.password === p)
    if (user && !(user as any).disabled) {
      touchUserActivity(u)
      const isAdmin = (user as any).role === 'admin' || ADMIN_USERS.has(u)
      return { username: u, isAdmin, isAdminAuth: false }
    }
  }

  return { username: null, isAdmin: false, isAdminAuth: false }
}

/** 判断是否要求强制登录 */
export function isAuthRequired(): boolean {
  return global.lx.config['auth.requireLogin'] !== false
}

/** 校验指定用户是否为管理员 */
export function isUserAdmin(username: string | null): boolean {
  if (!username) return false
  const u = global.lx.config.users.find(usr => usr.name === username)
  if (!u) return false
  return (u as any).role === 'admin' || ADMIN_USERS.has(username)
}

/** 暴露给 server.ts: 用户管理相关保存时调用以保持 lastActiveAt 同步 */
export function getUserDirPath(username: string): string {
  return path.join(global.lx.userPath, getUserDirname(username))
}
