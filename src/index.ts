import express from "express";
const PORT = process.env.NODE_ENV === 'development' ? 8080 : 80;
const app = express();
app.get("/test", (req, res) => {
  res.status(200).send("Hello World");
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});