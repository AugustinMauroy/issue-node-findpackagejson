import path from 'node:path';
import { transform } from 'esbuild';
import { findEsbuildConfig } from './find-esbuild-config.js';

/**
 * The load hook needs to know the parent URL to find the esbuild config.
 * But the resolve hook doesn't have access to the parent URL.
 * If you try to pass it as return value from the resolve hook, it will be overwritten by node
 */
let parentURL = null;


const jsxExts = new Set([
  '.jsx',
]);
const tsxExts = new Set([
  '.mts',
  '.ts',
  '.tsx',
]);
const formats = new Set(['jsx', 'tsx']);

/**
 * @type {import('node:module').ResolveHook}
 */
async function resolveTSX(specifier, ctx, nextResolve) {
  const nextResult = await nextResolve(specifier);
  // Check against the fully resolved URL, not just the specifier, in case another loader has
  // something to contribute to the resolution.
  const ext = path.extname(nextResult.url);

	parentURL = ctx.parentURL;

  if (jsxExts.has(ext)) return {
    ...nextResult,
    format: 'jsx',
  };

  if (tsxExts.has(ext)) return {
    ...nextResult,
    format: 'tsx',
  };

  return nextResult;
}
export { resolveTSX as resolve }

/**
 * @type {import('node:module').LoadHook}
 */
async function loadTSX(url, ctx, nextLoad) {
  if (!formats.has(ctx.format)) return nextLoad(url); // not j|tsx

  const format = 'module';
  const nextResult = await nextLoad(url, { format });
  let rawSource = `${nextResult.source}`; // byte array → string

	const esbuildConfig = findEsbuildConfig(parentURL);

  if (esbuildConfig.jsx === 'transform') rawSource = `import * as React from 'react';\n${rawSource}`;

  const { code: source, warnings } = await transform(rawSource, esbuildConfig)
    .catch(({ errors }) => {
      for (const {
        location: { column, line, lineText },
        text,
      } of errors) {
        console.error(`TranspileError: ${text}\n    at ${url}:${line}:${column}\n    at: ${lineText}\n`);
      }

      return {};
    });

  if (warnings?.length) console.warn(...warnings);

  return {
    format,
    source,
  };
}
export { loadTSX as load }

