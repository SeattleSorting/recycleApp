DROP TABLE IF EXISTS recyclables;


CREATE TABLE recyclables (
    id SERIAL PRIMARY KEY,
    category VARCHAR(255),
    item_name VARCHAR(255),
    recycling VARCHAR(255),
    donate VARCHAR(255),
    yard VARCHAR(255),
    garbage VARCHAR(255),
    tips VARCHAR(255)

);



