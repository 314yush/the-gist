import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'The Gist',
  short_name: 'The Gist',
  description: 'One-click explanations personalized to your knowledge. Select, copy, or just click — The Gist explains it your way.',
  version: '0.1.0',
  icons: {
    '16': 'public/icons/icon-16.png',
    '48': 'public/icons/icon-48.png',
    '128': 'public/icons/icon-128.png',
  },
  // contextMenus: right-click "Explain with The Gist"
  // scripting: inject content scripts to read text selections from active tab
  // storage: persist user wiki, API token, and onboarding state
  permissions: ['contextMenus', 'scripting', 'storage', 'activeTab'],
  // <all_urls>: needed to run scripting.executeScript on any tab to read selections
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  options_page: 'src/options/index.html',
  action: {
    default_title: 'The Gist — explain this',
  },
  commands: {
    _execute_action: {
      suggested_key: {
        default: 'Ctrl+Shift+L',
        mac: 'Command+Shift+L',
      },
      description: 'Capture & explain visible tab',
    },
  },
  content_scripts: [{
    matches: ['<all_urls>'],
    js: ['src/content/index.ts'],
    css: ['src/content/content.css'],
    run_at: 'document_idle',
  }],
  web_accessible_resources: [{
    resources: ['src/overlay/index.html'],
    matches: ['<all_urls>'],
  }],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
});
