#!/bin/bash

# Certificate renewal script for ZettaNote
# This script should be run periodically (e.g., via cron) to renew SSL certificates

echo "Checking for SSL certificate renewal..."

# Run certbot renewal
docker-compose exec nginx certbot renew --quiet

# Reload nginx to pick up new certificates
docker-compose exec nginx nginx -s reload

echo "Certificate renewal check completed."