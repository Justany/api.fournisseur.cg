import { defineConfig } from '@adonisjs/cors'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  headers: true,
  exposeHeaders: [
    'X-Content-Length-Fixed',
    'X-Documentation-Friendly',
    'X-Total-Pages',
    'X-Total',
    'X-Per-Page',
    'X-Current-Page',
  ],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
