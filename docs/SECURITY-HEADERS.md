# Required production security headers

The HTML meta policy provides partial defense in depth. Configure these as HTTP response headers at the hosting/CDN layer:

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()
Cross-Origin-Opener-Policy: same-origin
X-Frame-Options: DENY
```

Before enabling HSTS `includeSubDomains` or preload, verify every subdomain supports HTTPS. Test OCR/PDF WebAssembly and receipt camera selection after any CSP change.

GitHub Pages custom domains must have “Enforce HTTPS” enabled in repository Pages settings. GitHub Pages does not provide arbitrary custom response headers; use a capable reverse proxy/CDN or migrate hosting if all headers are required.
