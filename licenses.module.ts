/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxie les appels /api/v1/* du frontend vers le backend NestJS déployé
    // séparément sur Vercel — évite tout problème CORS entre les deux domaines.
    // BACKEND_URL est défini dans les variables d'environnement du projet Vercel
    // "frontend" (ex: https://mon-gestionnaire-api.vercel.app).
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    return [{ source: '/api/v1/:path*', destination: `${backendUrl}/api/v1/:path*` }];
  },
};
module.exports = nextConfig;
