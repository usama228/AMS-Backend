const express = require('express');
const sequelize = require('./config/db');
const path = require('path'); 
const userRoutes = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const avatarRoutes = require('./routes/avatarRoutes');
const helmet = require('helmet');
const cors = require('cors');
require('./models/associations'); 



const app = express();
app.use(helmet()); 
app.use(cors({
  origin: '*',
  
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});


app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use('/api', attendanceRoutes);
app.use('/api', leaveRoutes);

app.use('/api/images', avatarRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error: ', err.stack);
  res.status(500).json({ message: 'An internal error occurred', error: err.message });
});


const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error syncing with the database:', err);
    process.exit(1); 
  }
};

startServer();
