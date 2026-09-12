# ssl

Local HTTPS certificates for development are not committed to the repository.
Generate them before the first run:

```bash
pnpm cert:generate
```

The script in the root `package.json` runs `mkcert` and writes
`ssl/local.key` and `ssl/local.crt`, which are read by `vite.config.ts`
in `games-app`, `control-app` and `maintenance-app`.
