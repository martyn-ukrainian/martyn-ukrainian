import React from 'react'
import { useConfig, type DocsThemeConfig } from 'nextra-theme-docs'
import { Logo } from './components/Logo'

const config: DocsThemeConfig = {
  logo: <Logo />,
  project: {
    link: 'https://github.com/martyn-ukrainian',
  },
  chat: {
    link: 'https://t.me/ukrainianmartyn',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.9 4.3 18.6 19.8c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.4 13.5l-4.7-1.5c-1-.3-1-1 .2-1.5l18.4-7.1c.9-.3 1.6.2 1.3 1.4z" />
      </svg>
    ),
  },
  docsRepositoryBase:
    'https://github.com/martyn-ukrainian/martyn-ukrainian/tree/main',
  footer: {
    content: (
      <span>
        Built by{' '}
        <a href="https://github.com/martyn-ukrainian" target="_blank" rel="noreferrer">
          Martyn
        </a>{' '}
        — voice AI engineer, learning ML in public. © {new Date().getFullYear()}
      </span>
    ),
  },
  color: {
    hue: 15,
    saturation: 65,
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  feedback: {
    content: null,
  },
  editLink: {
    content: 'Edit this page on GitHub →',
  },
  toc: {
    backToTop: true,
    float: true,
  },
  head: function useHead() {
    const { title: pageTitle, frontMatter } = useConfig()
    const title = pageTitle ? `${pageTitle} — Martyn` : 'Martyn — Voice AI Engineer'
    const description =
      frontMatter?.description ||
      'Portfolio and open ML-engineering journal. 9 years shipping software; deep in voice AI & realtime telephony.'
    return (
      <>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content={title} />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
        <meta name="theme-color" content="#D97757" />
      </>
    )
  },
  faviconGlyph: '✦',
}

export default config
