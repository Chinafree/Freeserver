declare namespace LX {
  type AddMusicLocationType = 'top' | 'bottom'

  interface User {
    /**
     * 用户名
     */
    name: string

    /**
     * 连接密码
     */
    password: string

    /**
     * 最大备份快照数
     */
    maxSnapshotNum?: number

    /**
     * 添加歌曲到我的列表时的方式
     */
    'list.addMusicLocationType'?: AddMusicLocationType

    /**
     * 角色：admin(管理员) | user(普通用户)
     */
    role?: 'admin' | 'user'

    /**
     * 禁用状态
     */
    disabled?: boolean

    /**
     * 上次活跃时间 (毫秒时间戳)
     */
    lastActiveAt?: number

    /**
     * 创建时间 (毫秒时间戳)
     */
    createdAt?: number
  }

  interface UserConfig extends User {
    dataPath: string
  }

  interface Config {
    /**
     * 同步服务名称
     */
    'serverName': string

    /**
     * 是否使用代理转发请求到本服务器
     */
    'proxy.enabled': boolean

    /**
     * 代理转发的请求头 原始IP
     */
    'proxy.header': string

    /**
     * 绑定IP
     */
    bindIP: string

    /**
     * 端口
     */
    port: number

    /**
     * 是否开启用户路径 /<userName>
     */

    /**
     * 是否开启用户路径 /<userName>
     */
    'user.enablePath'?: boolean

    /**
     * 是否开启根路径 /
     */
    'user.enableRoot'?: boolean

    /**
     * 是否启用公开用户权限限制
     */
    'user.enablePublicRestriction'?: boolean

    /**
     * 是否启用登录用户缓存限制
     */
    'user.enableLoginCacheRestriction'?: boolean
    /**
     * 是否启用缓存空间限制
     */
    'user.enableCacheSizeLimit'?: boolean
    /**
     * 缓存空间限制大小 (MB)
     */
    'user.cacheSizeLimit'?: number

    /**
     * 公共最大备份快照数
     */
    maxSnapshotNum: number

    /**
     * 公共添加歌曲到我的列表时的方式 top | bottom，参考客户端的设置-列表设置-添加歌曲到我的列表时的方式
     */
    'list.addMusicLocationType': AddMusicLocationType

    /**
     * 同步用户
     */
    users: UserConfig[]

    /**
     * 前端访问密码
     */
    'frontend.password'?: string

    /**
     * WebDAV URL
     */
    'webdav.url'?: string

    /**
     * WebDAV 用户名
     */
    'webdav.username'?: string

    /**
     * WebDAV 密码
     */
    'webdav.password'?: string

    /**
     * 同步间隔(分钟)
     */
    'sync.interval'?: number

    /**
     * 是否开启Web播放器访问密码
     */
    'player.enableAuth'?: boolean

    /**
     * Web播放器访问密码
     */
    'player.password'?: string

    /**
     * 是否启用针对所有外发请求的代理 (目前主要用于 Music SDK)
     */
    'proxy.all.enabled'?: boolean

    /**
     * 代理地址 (支持 http:// 或 socks5://)
     */
    'proxy.all.address'?: string

    /**
     * 是否禁用数据收集
     */
    disableTelemetry?: boolean

    /**
     * 后台管理界面访问路径，默认为空字符串（表示根路径 /）
     */
    'admin.path'?: string

    /**
     * Web播放器访问路径，默认为 /music
     */
    'player.path'?: string

    /**
     * 是否启用 Subsonic 协议支持 (默认 true)
     */
    'subsonic.enable'?: boolean

    /**
     * Subsonic 访问路径 (默认 /rest)
     */
    'subsonic.path'?: string

    /**
     * Subsonic 搜索音源 (用于 search3 实时在线搜索；推荐 wy/tx)
     */
    'subsonic.searchSource'?: string

    /**
     * 歌手信息源优先级
     */
    'singer.sourcePriority': Array<'tx' | 'wy'>
    /**
     * 缓存命名规则
     */
    'cache.namingPattern'?: string
    /**
     * 缓存存储位置
     */
    serverCacheLocation?: string
    /**
     * 是否允许运行 VM 模式自定义源脚本
     */
    'system.allowUnsafeVM'?: boolean

    /**
     * 是否仅启用公共源 (Free Music 模式)
     */
    'source.publicOnly'?: boolean

    /**
     * 是否要求所有 API 必须登录
     */
    'auth.requireLogin'?: boolean

    /**
     * 是否禁用服务器磁盘歌曲缓存
     */
    'stream.disableCache'?: boolean
  }
}

