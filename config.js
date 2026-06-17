module.exports = {
  "serverName": "free-music",
  "proxy.enabled": false,
  "proxy.header": "x-real-ip",
  "bindIP": "0.0.0.0",
  "port": 9527,
  "user.enablePath": true,
  "user.enableRoot": false,
  "user.enablePublicRestriction": true,
  "user.enableLoginCacheRestriction": false,
  "user.enableCacheSizeLimit": false,
  "user.cacheSizeLimit": 2000,
  "maxSnapshotNum": 10,
  "list.addMusicLocationType": "top",
  "disableTelemetry": false,
  "users": [
    {
      "name": "admin",
      "password": "admin",
      "dataPath": "F:\\music\\code\\Freeserver\\data\\users\\admin_21232f",
      "role": "admin",
      "disabled": false,
      "createdAt": 1781657391068,
      "lastActiveAt": 0
    },
    {
      "name": "free",
      "password": "free",
      "dataPath": "F:\\music\\code\\Freeserver\\data\\users\\free_aa2d6e",
      "role": "user",
      "disabled": false,
      "createdAt": 1781657391068,
      "lastActiveAt": 0
    }
  ],
  "frontend.password": "123456",
  "webdav.url": "",
  "webdav.username": "",
  "webdav.password": "",
  "sync.interval": 60,
  "player.enableAuth": false,
  "player.password": "123456",
  "proxy.all.enabled": false,
  "proxy.all.address": "",
  "admin.path": "",
  "player.path": "/music",
  "subsonic.enable": true,
  "subsonic.path": "/rest",
  "subsonic.searchSource": "wy",
  "singer.sourcePriority": [
    "tx",
    "wy"
  ],
  "cache.namingPattern": "standard",
  "system.allowUnsafeVM": false,
  "source.publicOnly": true,
  "auth.requireLogin": true,
  "stream.disableCache": true
}