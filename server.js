// server.js
const express = require('express');
const cors = require('cors');
const emailRoutes = require('./routes/email'); // adjust path as needed

const app = express();

app.use(cors());
app.use(express.json());
app.use(emailRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});