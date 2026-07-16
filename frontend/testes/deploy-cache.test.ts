import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("cache de deploy do frontend", () => {
  it("não deixa o HTML da SPA preso em cache antigo", () => {
    const nginx = source("../docker/nginx/frontend.conf");

    expect(nginx).toContain("location = /index.html");
    expect(nginx).toContain('Cache-Control "no-cache, no-store, must-revalidate"');
    expect(nginx).toContain('try_files $uri /index.html');
  });

  it("comprime respostas textuais e mantém assets versionados em cache imutável", () => {
    const nginx = source("../docker/nginx/frontend.conf");

    expect(nginx).toContain("gzip on;");
    expect(nginx).toContain("gzip_types");
    expect(nginx).toContain("location ^~ /assets/");
    expect(nginx).toContain('Cache-Control "public, max-age=31536000, immutable"');
    expect(nginx).toContain("webp");
  });
});
