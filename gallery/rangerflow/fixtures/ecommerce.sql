-- A small e-commerce schema: the ERD fixture the demo and the tests both use.
-- Deliberately covers the shapes a diagram has to get right — a self
-- reference, a many-to-many join table, a composite key, a nullable foreign
-- key (optional relationship), a unique column (one-to-one), and indexes.

CREATE TABLE countries (
    id          INTEGER      PRIMARY KEY,
    iso_code    CHAR(2)      NOT NULL UNIQUE,
    name        VARCHAR(80)  NOT NULL
);

CREATE TABLE customers (
    id          INTEGER      PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL,
    country_id  INTEGER      REFERENCES countries(id),
    referred_by INTEGER      REFERENCES customers(id),
    created_at  TIMESTAMP    NOT NULL,
    UNIQUE (email)
);

CREATE TABLE customer_profiles (
    customer_id INTEGER      PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
    birthday    DATE,
    newsletter  BOOLEAN      NOT NULL
);

CREATE TABLE categories (
    id          INTEGER      PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL,
    parent_id   INTEGER      REFERENCES categories(id)
);

CREATE TABLE products (
    id          INTEGER      PRIMARY KEY,
    sku         VARCHAR(40)  NOT NULL UNIQUE,
    name        VARCHAR(160) NOT NULL,
    price_cents INTEGER      NOT NULL,
    CHECK (price_cents >= 0)
);

CREATE TABLE product_categories (
    product_id  INTEGER      NOT NULL,
    category_id INTEGER      NOT NULL,
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id)  REFERENCES products(id)   ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id           INTEGER     PRIMARY KEY,
    customer_id  INTEGER     NOT NULL,
    placed_at    TIMESTAMP   NOT NULL,
    status       VARCHAR(24) NOT NULL,
    total_cents  INTEGER     NOT NULL,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
    id          INTEGER      PRIMARY KEY,
    order_id    INTEGER      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  INTEGER      NOT NULL REFERENCES products(id),
    quantity    INTEGER      NOT NULL,
    unit_cents  INTEGER      NOT NULL
);

CREATE TABLE payments (
    id          INTEGER      PRIMARY KEY,
    order_id    INTEGER      NOT NULL UNIQUE REFERENCES orders(id),
    paid_at     TIMESTAMP,
    amount_cents INTEGER     NOT NULL,
    method      VARCHAR(24)  NOT NULL
);

CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE UNIQUE INDEX idx_products_sku ON products (sku);
