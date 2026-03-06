import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'MTN Drive Documentation',
  tagline: 'Partner documentation for the MTN Drive SDK and API',
  favicon: 'img/favicon.ico',
  url: 'https://mtn-drive-sdk-docs.pipeops.app',
  baseUrl: '/',
  organizationName: 'PipeOpsHQ',
  projectName: 'mtn-drive-documentation',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'sdk',
        path: './sdk',
        routeBasePath: 'sdk',
        sidebarPath: './sidebars-sdk.ts',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'api',
        path: './api',
        routeBasePath: 'api',
        sidebarPath: './sidebars-api.ts',
      },
    ],
  ],
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'MTN Drive Docs',
      logo: {
        alt: 'MTN Drive Docs',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/sdk/overview',
          position: 'left',
          label: 'SDK Docs',
        },
        {
          to: '/api/overview',
          position: 'left',
          label: 'API Docs',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'SDK Docs',
          items: [
            {
              label: 'Overview',
              to: '/sdk/overview',
            },
            {
              label: 'Quickstart (React Native)',
              to: '/sdk/quickstart-react-native',
            },
          ],
        },
        {
          title: 'API Docs',
          items: [
            {
              label: 'API Overview',
              to: '/api/overview',
            },
            {
              label: 'Authentication',
              to: '/api/authentication',
            },
            {
              label: 'Drive',
              to: '/api/drive',
            },
            {
              label: 'Photo Backup',
              to: '/api/photo-backup',
            },
            {
              label: 'Managed Uploads',
              to: '/api/managed-uploads',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} PipeOpsHQ.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
