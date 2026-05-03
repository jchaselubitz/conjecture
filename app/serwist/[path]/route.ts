import { createSerwistRoute } from '@serwist/turbopack';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const workerRevision = createHash('sha256')
  .update(readFileSync(new URL('../../../yarn.lock', import.meta.url)))
  .digest('hex');

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    swSrc: 'app/sw.ts',
    useNativeEsbuild: true,
    additionalPrecacheEntries: [
      {
        url: '/manifest.webmanifest',
        revision: workerRevision
      }
    ]
  }
);
