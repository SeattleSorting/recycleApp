DROP TABLE IF EXISTS recyclables;


CREATE TABLE recyclables (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255),
    category VARCHAR(255),
    subcategory VARCHAR(255),
    garbage VARCHAR(255),
    recycling VARCHAR(255),
    yard VARCHAR(255),
    reuse VARCHAR(255),
    hazard VARCHAR(255),
    waste_transfer VARCHAR(255),
    binside VARCHAR(255),
    tips VARCHAR(255)
);



