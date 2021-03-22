/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = {
  title: 'Recoil',
  tagline: 'A state management library for React',
  url: 'https://recoiljs.org',
  baseUrl: '/',
  favicon: 'img/favicon.png',
  organizationName: 'facebookexperimental', // Usually your GitHub org/user name.
  projectName: 'Recoil', // Usually your repo name.
  themeConfig: {
     algolia: {
      apiKey: '9c5a009951e793525603922b8ca66628',
      indexName: 'recoiljs'
    },
    googleAnalytics: {
      trackingID: 'UA-44373548-46',
    },
    image: 'img/og-image.png',
    navbar: {
      logo: {
        alt: 'Recoil',
        src: 'img/logo.svg',
        srcDark: 'img/logo--dark.svg',
        href: '/',
        target: '_self'
      },
      items: [
        {
          to: 'docs/introduction/installation',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {to: 'blog', label: 'Blog', position: 'left'},
        // Please keep GitHub link to the right for consistency.
        {
          href: 'https://github.com/facebookexperimental/Recoil',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/introduction/getting-started',
            },
            {
              label: 'Core Concepts',
              to: 'docs/introduction/core-concepts',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            // {
            //   label: 'Stack Overflow',
            //   href: 'https://stackoverflow.com/questions/tagged/recoil',
            // },
            {
              label: 'Twitter',
              href: 'https://twitter.com/recoiljs',
            },
            // {
            //   label: 'Discord',
            //   href: 'https://discordapp.com/invite/docusaurus',
            // },
          ],
        },
        {
          title: 'More',
          items: [
            // {
            //   label: 'Blog',
            //   to: 'blog',
            // },
            {
              label: 'GitHub',
              href: 'https://github.com/facebookexperimental/Recoil',
            },
          ],
        },
        {
          title: 'Legal',
          // Please do not remove the privacy and terms, it's a legal requirement.
          items: [
            {
              label: 'Privacy',
              href: 'https://opensource.facebook.com/legal/privacy/',
              target: '_blank',
              rel: 'noreferrer noopener',
            },
            {
              label: 'Terms',
              href: 'https://opensource.facebook.com/legal/terms/',
              target: '_blank',
              rel: 'noreferrer noopener',
            },
          ],
        },
      ],
      logo: {
        alt: 'Facebook Open Source Logo',
        src: 'img/oss_logo.png',
        href: 'https://opensource.facebook.com',
      },
      // Please do not remove the credits, help to publicize Docusaurus :)
      copyright: `Copyright © ${new Date().getFullYear()} Facebook, Inc. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/facebookexperimental/Recoil/edit/docs/docs/',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/facebookexperimental/Recoil/edit/docs/docs/blog/',
           feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} Facebook, Inc.`,
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: ['@docusaurus/plugin-google-analytics'],
};
