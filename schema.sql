DROP TABLE IF EXISTS recyclables;


CREATE TABLE recyclables (
    id SERIAL PRIMARY KEY,
    material VARCHAR(255),
    item VARCHAR(255),
    result VARCHAR(255)
);



