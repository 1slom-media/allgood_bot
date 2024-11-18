import Client from "pg";

connection
const client = new Client.Client({
  host: "localhost",
  user: "postgres",
  password: "Postgres",
  database: "allgood_bot",
  port: 5432,
});

// const client = new Client.Client({
//   host: "localhost",
//   user: "postgres",
//   password: "islom_01",
//   database: "allgood",
//   port: 5432,
// });

export default client;