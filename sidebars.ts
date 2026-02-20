import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'overview',
    'install-npm',
    'quickstart-react-native',
    {
      type: 'doc',
      id: 'rn-interfaces',
      label: 'React Native Required Interfaces',
    },
    {
      type: 'doc',
      id: 'rn-sdk-methods-reference',
      label: 'React Native SDK Methods Reference',
    },
    'quickstart-core',
    'error-retry-matrix',
    'example',
    'release-versioning',
  ],
};

export default sidebars;
