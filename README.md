# Restaurant Menu API (Assessment A6)

An in-memory REST API built with Node.js and Express. Records reset whenever the server restarts, as required by the assessment.

## Run it

1. Install Node.js if it is not already installed.
2. Open a terminal in this folder.
3. Run `npm install` once.
4. Run `npm start` and keep that terminal open. The API listens on `PORT`, or port 8080 by default.
5. In the assessment kit folder, run `npm run evaluate` as instructed by your trainer. Restart the server before each evaluation run.

## Routes

- `POST /api/dishes` create a dish
- `GET /api/dishes` list, filter, search, sort, and paginate
- `GET /api/dishes/:id` read one dish
- `PUT /api/dishes/:id` replace all dish fields
- `PATCH /api/dishes/:id` update supplied dish fields
- `DELETE /api/dishes/:id` delete a dish

## Note about duplicates

The resource rules say duplicate records are allowed. The marking table appears to mention a duplicate rule, which conflicts with that statement. This implementation follows the explicit resource rule and permits identical dishes. Confirm with your trainer if the assessment kit resolves the conflict differently.

This is a learning project. Read `index.js` by section and try explaining the validation and list-query pipeline before your assessment.


