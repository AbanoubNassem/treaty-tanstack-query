import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Treaty TanStack Query",
  description: "Type-safe TanStack React Query for Eden Treaty (Elysia)",
  base: "/treaty-tanstack-query/",

  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }]],

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/query-options" },
      { text: "Examples", link: "/examples/basic" },
      {
        text: "Links",
        items: [
          {
            text: "GitHub",
            link: "https://github.com/AbanoubNassem/treaty-tanstack-query",
          },
          {
            text: "npm",
            link: "https://www.npmjs.com/package/treaty-tanstack-react-query",
          },
          { text: "TanStack Query", link: "https://tanstack.com/query" },
          { text: "Elysia", link: "https://elysiajs.com" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Why This Library?", link: "/guide/why" },
          ],
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Treaty Provider", link: "/guide/treaty-provider" },
            { text: "Query Options", link: "/guide/query-options" },
            { text: "Mutation Options", link: "/guide/mutation-options" },
            { text: "Query Keys", link: "/guide/query-keys" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Infinite Queries", link: "/guide/infinite-queries" },
            { text: "Subscriptions", link: "/guide/subscriptions" },
            { text: "SSR & Hydration", link: "/guide/ssr" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "queryOptions", link: "/api/query-options" },
            { text: "mutationOptions", link: "/api/mutation-options" },
            {
              text: "infiniteQueryOptions",
              link: "/api/infinite-query-options",
            },
            { text: "TreatyProvider", link: "/api/treaty-provider" },
            { text: "useTreaty", link: "/api/use-treaty" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "Basic Usage", link: "/examples/basic" },
            { text: "With Suspense", link: "/examples/suspense" },
            { text: "Mutations", link: "/examples/mutations" },
            { text: "Infinite Scroll", link: "/examples/infinite-scroll" },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/AbanoubNassem/treaty-tanstack-query",
      },
    ],

    search: {
      provider: "local",
    },

    editLink: {
      pattern:
        "https://github.com/AbanoubNassem/treaty-tanstack-query/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    footer: {
      message: "Released under the Apache 2.0 License.",
      copyright: "Copyright © 2026-present",
    },
  },
});
