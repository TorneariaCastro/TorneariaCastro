import type { NextConfig } from "next";

/**
 * Política de conteúdo: diz ao navegador de onde ele pode carregar cada tipo
 * de recurso. O `unsafe-inline`/`unsafe-eval` em scripts é uma concessão ao
 * Next.js, que injeta scripts inline (inclusive o que aplica o tema antes da
 * página aparecer). Mesmo com essa concessão, as demais diretivas continuam
 * valendo — em especial `frame-ancestors`, que é o que impede o site de ser
 * embutido em outra página para enganar o visitante.
 */
const politicaDeConteudo = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const cabecalhosDeSeguranca = [
  // Impede que o site seja carregado dentro de outra página (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: politicaDeConteudo },
  // Impede o navegador de "adivinhar" o tipo de um arquivo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza o endereço interno visitado ao clicar em links para fora.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O sistema não usa câmera, microfone nem localização — desliga tudo.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // Deixa de anunciar "este site roda Next.js" em toda resposta.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: cabecalhosDeSeguranca }];
  },
};

export default nextConfig;
