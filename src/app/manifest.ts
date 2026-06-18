import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluffy's Portal",
    short_name: "Fluffy's",
    description: "Intern kassa och driftportal för Fluffy's.",
    start_url: '/kassa',
    scope: '/',
    display: 'standalone',
    background_color: '#f8faf8',
    theme_color: '#1f6f4a',
    icons: [
      {
        src: '/fluffys/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
