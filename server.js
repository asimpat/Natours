const dotenv = require('dotenv');

dotenv.config({ path: 'config.env' });
const db = require('./config/db');

const app = require('./app');

const port = process.env.PORT || 8000;
db();
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
});
