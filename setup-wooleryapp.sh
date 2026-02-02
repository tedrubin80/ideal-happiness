#!/bin/bash
#
# Setup script for wooleryapp.com
# Run with: sudo bash setup-wooleryapp.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Woolery App Setup Script ===${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run with sudo${NC}"
    echo "Usage: sudo bash setup-wooleryapp.sh"
    exit 1
fi

DOMAIN="wooleryapp.com"
WEB_ROOT="/var/www/patternrec"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

# Step 1: Fix line endings (remove Windows CRLF)
echo -e "${YELLOW}[1/5] Fixing line endings...${NC}"
if command -v dos2unix &> /dev/null; then
    find "$WEB_ROOT" -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.txt" -o -name "*.md" \) -exec dos2unix -q {} \;
else
    # Fallback using sed
    find "$WEB_ROOT" -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.txt" -o -name "*.md" \) -exec sed -i 's/\r$//' {} \;
fi
echo -e "${GREEN}Done${NC}"

# Step 2: Set ownership and permissions
echo -e "${YELLOW}[2/5] Setting ownership and permissions...${NC}"
chown -R www-data:www-data "$WEB_ROOT"
find "$WEB_ROOT" -type d -exec chmod 755 {} \;
find "$WEB_ROOT" -type f -exec chmod 644 {} \;
echo -e "${GREEN}Done${NC}"

# Step 3: Create nginx configuration
echo -e "${YELLOW}[3/5] Creating nginx configuration...${NC}"
cat > "$NGINX_CONF" << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;

    server_name wooleryapp.com www.wooleryapp.com;
    root /var/www/patternrec;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript text/javascript;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Main location
    location / {
        try_files $uri $uri/ =404;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;

    # Logging
    access_log /var/log/nginx/wooleryapp.access.log;
    error_log /var/log/nginx/wooleryapp.error.log;
}
NGINX_EOF
echo -e "${GREEN}Done${NC}"

# Step 4: Enable the site
echo -e "${YELLOW}[4/5] Enabling site...${NC}"
if [ -L "$NGINX_ENABLED" ]; then
    rm "$NGINX_ENABLED"
fi
ln -s "$NGINX_CONF" "$NGINX_ENABLED"
echo -e "${GREEN}Done${NC}"

# Step 5: Test and reload nginx
echo -e "${YELLOW}[5/5] Testing and reloading nginx...${NC}"
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo -e "${GREEN}Done${NC}"
else
    echo -e "${RED}Nginx config test failed. Please check the configuration.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Site configured at: http://${DOMAIN}"
echo ""
echo "Next steps:"
echo "  1. Point your DNS A record for ${DOMAIN} to this server's IP"
echo "  2. (Optional) Set up SSL with: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
