DROP TABLE IF EXISTS recyles;

CREATE TABLE recycles (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(255),
    category VARCHAR(255)
);