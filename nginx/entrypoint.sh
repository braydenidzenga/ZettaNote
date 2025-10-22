#!/bin/sh

# Function to check if certificates exist
check_certificates() {
    if [ -f "/etc/letsencrypt/live/zettanote.tech/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/zettanote.tech/privkey.pem" ]; then
        return 0
    else
        return 1
    fi
}

# Wait for nginx to be ready (if needed)
sleep 2

# Check if certificates exist
if ! check_certificates; then
    echo "SSL certificates not found. Obtaining certificates..."

    # Stop nginx temporarily for certbot
    nginx -s stop 2>/dev/null || true

    # Obtain SSL certificates
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@zettanote.tech \
        --domains zettanote.tech \
        --domains api.zettanote.tech \
        --cert-name zettanote.tech

    # Check if certbot was successful
    if check_certificates; then
        echo "SSL certificates obtained successfully"
    else
        echo "Failed to obtain SSL certificates. Using self-signed certificates for now."
        # Generate self-signed certificates as fallback
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/letsencrypt/live/zettanote.tech/privkey.pem \
            -out /etc/letsencrypt/live/zettanote.tech/fullchain.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=zettanote.tech"
    fi
else
    echo "SSL certificates already exist"
fi

# Start nginx
echo "Starting nginx..."
nginx -g "daemon off;"