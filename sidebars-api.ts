import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  apiSidebar: [
    'overview',
    'authentication',
    'drive',
    'photo-backup',
    'managed-uploads',
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference-authentication',
        'api-reference-drive',
        'api-reference-photo-backup',
        'api-reference-managed-uploads',
      ],
    },
  ],
};

export default sidebars;
