# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:import-analysis] Failed to resolve import \"../utils/timezoneUtils\" from \"src/components/UpdateCampaignModal.tsx\". Does the file exist?"
  - generic [ref=e5]: /app/src/components/UpdateCampaignModal.tsx:5:30
  - generic [ref=e6]: "20 | import { updateCampaign } from \"../services/campaigns\"; 21 | import leadService from \"../services/leadsService\"; 22 | import { timezoneUtils } from \"../utils/timezoneUtils\"; | ^ 23 | import toast from \"react-hot-toast\"; 24 | const UpdateCampaignModal = ({ isOpen, onClose, campaign, onCampaignUpdate }) => {"
  - generic [ref=e7]: at TransformPluginContext._formatError (file:///app/node_modules/vite/dist/node/chunks/dep-CDnG8rE7.js:49193:41) at TransformPluginContext.error (file:///app/node_modules/vite/dist/node/chunks/dep-CDnG8rE7.js:49188:16) at normalizeUrl (file:///app/node_modules/vite/dist/node/chunks/dep-CDnG8rE7.js:63984:23) at process.processTicksAndRejections (node:internal/process/task_queues:105:5) at async file:///app/node_modules/vite/dist/node/chunks/dep-CDnG8rE7.js:64116:39 at async Promise.all (index 7) at async TransformPluginContext.transform (file:///app/node_modules/vite/dist/node/chunks/dep-CDnG8rE7.js:64043:7) at async PluginContainer.transform (file:///app/node_modules/vite/dist/node/chunks/dep-CDnG8rE7.js:49034:18) at async loadAndTransform (file:///app/node_modules/vite/dist/node/chunks/dep-CDnG8rE7.js:51867:27) at async viteTransformMiddleware (file:///app/node_modules/vite/dist/node/chunks/dep-CDnG8rE7.js:61824:24
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.ts
    - text: .
```