import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  apiSidebar: [
    'overview',
    'service-integration',
    'drive',
    'photo-backup',
    'managed-uploads',
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference-service-integration',
        'api-reference-drive',
        'api-reference-photo-backup',
        'api-reference-managed-uploads',
      ],
    },
  ],
};

export default sidebars;
