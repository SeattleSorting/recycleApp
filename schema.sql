DROP TABLE IF EXISTS recyles;

CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    material VARCHAR(255)
);


CREATE TABLE items {
    id SERIAL PRIMARY KEY,
    item VARCHAR(255),
    result VARCHAR(255),
    materials_id INTEGER NOT NULL REFERENCES materials(id)
}



