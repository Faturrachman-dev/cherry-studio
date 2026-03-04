/**
 * Stub for useApiServer — API Server feature has been stripped.
 * Returns permanently-disabled state so agent code degrades gracefully.
 */
export const useApiServer = () => ({
  apiServerConfig: { enabled: false, host: '127.0.0.1', port: 23333, apiKey: '' },
  apiServerRunning: false,
  apiServerLoading: false,
  startApiServer: async () => {},
  stopApiServer: async () => {},
  restartApiServer: async () => {},
  checkApiServerStatus: async () => {},
  setApiServerEnabled: () => {}
})
