import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'MTN Drive SDK',
  tagline: 'SDK documentation for partner engineering teams',
  favicon: 'img/favicon.ico',
  url: 'https://mtn-drive-sdk-docs.pipeops.app',
  baseUrl: '/',
  organizationName: 'PipeOpsHQ',
  projectName: 'mtn-drive-sdk',
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
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: 'https://github.com/PipeOpsHQ/mtn-drive-sdk/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'MTN Drive SDK',
      logo: {
        alt: 'MTN Drive SDK',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'overview',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/PipeOpsHQ/mtn-drive-sdk',
          label: 'GitHub',
          position: 'right',
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
              to: '/docs/overview',
            },
            {
              label: 'Quickstart (Core)',
              to: '/docs/quickstart-core',
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
