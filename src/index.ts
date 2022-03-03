import express from "express";
const PORT = process.env.PORT || 3000;
const app = express();
app.get("/test", (req, res) => {
  res.status(200).send("Hello Chat Server");
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});