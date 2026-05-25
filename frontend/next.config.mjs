
/** @type {import('next').NextConfig} */
const isGithubPages = process.env.DEPLOY_TARGET === 'gh-pages' || (!process.env.VERCEL && process.env.NODE_ENV === 'production');

const nextConfig = {
  output: isGithubPages ? 'export' : undefined,
  basePath: isGithubPages ? '/Our-own-OS' : '',
  assetPrefix: isGithubPages ? '/Our-own-OS/' : undefined,
};

export default nextConfig;
