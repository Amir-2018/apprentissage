const express = require("express");
const path = require("node:path");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (request, response) => {
  response.render("index", {
    title: "Wort für Wort — Révise ton allemand",
  });
});

app.use((request, response) => {
  response.status(404).send("Page introuvable.");
});

app.listen(port, () => {
  console.log(`Wort für Wort est disponible sur http://localhost:${port}`);
});
