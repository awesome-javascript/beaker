export default {
  eventsStream: 'readable',
  getInfo: 'promise',
  checkForUpdates: 'promise',
  restartBrowser: 'sync',

  isIPFSDaemonActive: 'sync',

  getSettings: 'promise',
  getSetting: 'promise',
  setSetting: 'promise',

  listPlugins: 'promise',
  lookupPlugin: 'promise',
  installPlugin: 'promise',
  uninstallPlugin: 'promise',

  getHomePages: 'promise',
  getProtocolDescription: 'sync',

  getDefaultProtocolSettings: 'promise',
  setAsDefaultProtocolClient: 'promise',
  removeAsDefaultProtocolClient: 'promise',

  showOpenDialog: 'promise',
  openUrl: 'sync'
}