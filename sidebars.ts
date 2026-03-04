import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'overview',
    'install-npm',
    'quickstart-react-native',
    'common-recipes',
    'concepts',
    'rn-troubleshooting',
    'error-retry-matrix',
    'example',
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'rn-interfaces',
        'rn-sdk-methods-reference',
        'rn-methods-managed-uploads',
        'rn-methods-sessions',
        'rn-methods-drive',
        'rn-methods-sharing',
        'rn-methods-bin',
        'rn-methods-photo-backup',
        'rn-methods-storage',
      ],
    },
    'glossary',
    'faq',
    'release-versioning',
  ],
};

export default sidebars;
