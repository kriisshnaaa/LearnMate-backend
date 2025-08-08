const express = require('express');
const cors = require('cors');
require('dotenv').config();

const openaiRoutes = require('./routes/openai');



const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/openai', openaiRoutes);  // Mount API routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
