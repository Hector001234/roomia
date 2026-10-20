FROM php:8.3-fpm-alpine

RUN apk add --no-cache libpng-dev libwebp-dev oniguruma-dev libxml2-dev zip unzip curl     && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath

WORKDIR /var/www/html
COPY . .
EXPOSE 9000
CMD ["php-fpm"]
