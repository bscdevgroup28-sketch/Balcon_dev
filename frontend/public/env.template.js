// This file can be copied to env.js at deploy time to override build-time vars.
// window.__ENV__ allows dynamic replacement without rebuilding the bundle.
window.__ENV__ = {
  REACT_APP_API_URL: '%%API_URL%%'
};
