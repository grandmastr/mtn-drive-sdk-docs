import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'overview',
    'install-npm',
    {
      type: 'category',
      label: 'React Native SDK',
      items: [
        'quickstart-react-native',
        'rn-interfaces',
        'rn-sdk-methods-reference',
        'rn-methods-sessions',
        'rn-methods-drive',
        'rn-methods-sharing',
        'rn-methods-bin',
        'rn-methods-photo-backup',
        'rn-methods-storage',
        'rn-methods-managed-uploads',
        'rn-troubleshooting',
        'error-retry-matrix',
      ],
    },
    'example',
    'release-versioning',
  ],
};

export default sidebars;
