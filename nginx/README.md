# Nginx Setup for ZettaNote

This directory contains the Nginx configuration for ZettaNote with SSL/TLS support via Certbot.

## Overview

The Nginx setup provides:

- Reverse proxy for frontend (zettanote.tech) on port 3000
- Reverse proxy for backend API (api.zettanote.tech) on port 4000
- SSL/TLS encryption using Let's Encrypt certificates
- Automatic HTTP to HTTPS redirection
- Security headers and rate limiting
- Blocking of all other ports/domains

## Files

- `Dockerfile`: Custom Nginx image with Certbot
- `nginx.conf`: Main Nginx configuration
- `conf.d/default.conf`: Server blocks for domain routing
- `entrypoint.sh`: Startup script that handles certificate generation

## Domain Configuration

- **zettanote.tech**: Routes to frontend container (port 3000)
- **api.zettanote.tech**: Routes to backend container (port 4000)
- All other domains/ports are blocked

## SSL Certificates

Certificates are automatically obtained and renewed using Certbot:

- Primary certificate: `zettanote.tech` (covers both domains)
- Certificate location: `/etc/letsencrypt/live/zettanote.tech/`

## Certificate Renewal

To manually renew certificates:

```bash
docker-compose exec nginx certbot renew
docker-compose exec nginx nginx -s reload
```

Or use the provided script:

```bash
./renew-certificates.sh
```

For automatic renewal, set up a cron job:

```bash
0 12 * * * /path/to/zettanote/renew-certificates.sh
```

## Security Features

- HTTP to HTTPS redirection
- Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- Rate limiting (100 req/s general, 10 req/s API)
- Content Security Policy
- Blocking of unauthorized domains

## Ports

- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS (main traffic)
- All other ports are blocked at the firewall level

## Health Checks

- `/health` endpoint available on both domains
- Container health checks configured

## Deployment

The Nginx container is included in the main `docker-compose.yml` and will:

1. Check for existing SSL certificates
2. Obtain new certificates if needed (using HTTP-01 challenge)
3. Start Nginx with SSL termination
4. Route traffic to appropriate backend services

## Troubleshooting

### Certificate Issues

- Check certificate validity: `docker-compose exec nginx certbot certificates`
- View certbot logs: `docker-compose logs nginx`
- Force renewal: `docker-compose exec nginx certbot renew --force-renewal`

### Nginx Issues

- Check configuration: `docker-compose exec nginx nginx -t`
- View logs: `docker-compose logs nginx`
- Reload config: `docker-compose exec nginx nginx -s reload`

### Network Issues

- Ensure DNS points to your server
- Check firewall allows ports 80 and 443
- Verify containers are running: `docker-compose ps`
