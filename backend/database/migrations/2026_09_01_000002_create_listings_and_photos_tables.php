<?php

declare(strict_types=1);

namespace Database\Migrations;

/**
 * Data Store D2: Catalog, Listings, WebP Photos and Amenities in 3rd Normal Form (3NF).
 */
final class CreateListingsAndPhotosTables
{
    public function upSql(): string
    {
        return <<<'SQL'
CREATE TABLE listings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    host_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    max_guests TINYINT UNSIGNED NOT NULL DEFAULT 2,
    cancellation_policy ENUM('FLEXIBLE', 'MODERATE', 'STRICT') NOT NULL DEFAULT 'MODERATE',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_listings_host FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_listings_lat CHECK (latitude BETWEEN -90.0000000 AND 90.0000000),
    CONSTRAINT chk_listings_lng CHECK (longitude BETWEEN -180.0000000 AND 180.0000000),
    CONSTRAINT chk_listings_price CHECK (price_per_night > 0),
    INDEX idx_listings_search_composite (status, city, max_guests, price_per_night)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listing_photos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    listing_id BIGINT UNSIGNED NOT NULL,
    s3_url VARCHAR(512) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50) NOT NULL DEFAULT 'image/webp',
    file_size_kb INT UNSIGNED NOT NULL,
    sort_order TINYINT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_photos_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE amenities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listing_amenity (
    listing_id BIGINT UNSIGNED NOT NULL,
    amenity_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (listing_id, amenity_id),
    CONSTRAINT fk_la_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT,
    CONSTRAINT fk_la_amenity FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
    }
}
