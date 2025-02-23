import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  sassOptions: {
    silenceDeprecations: [
      'import',
      'global-builtin',
      'mixed-decls',
      'color-functions',
      'legacy-js-api'
    ]
  }
};

export default nextConfig;
