const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Підключення до MongoDB
const dbURI = process.env.DB_URI;
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB підключено'))
  .catch(err => console.log('Помилка підключення до MongoDB:', err));

// ======= Схема для акаунтів (менеджер паролів) =======
const accountSchema = new mongoose.Schema({
  email: { type: String, required: true },
  steamLogin: { type: String, required: true }, // Додано поле для Логіну Steam
  googlePassword: { type: String, required: true },
  steamPassword: { type: String, required: true },
  purchased: { type: Boolean, required: true },
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema, 'password_manager');

// ======= Схема для користувачів (реєстрація/вхід) =======
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema, 'users');

// ======= Роут: Реєстрація =======
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Користувач вже існує' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: 'Реєстрація успішна' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка при реєстрації', error: err.message });
  }
});

// ======= Роут: Вхід =======
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Невірний пароль' });

    res.status(200).json({ message: 'Вхід успішний' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка при вході', error: err.message });
  }
});

// ======= Роут: Отримати всі акаунти =======
app.get('/accounts', async (req, res) => {
  try {
    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка при отриманні акаунтів', error: err.message });
  }
});

// ======= Роут: Додати акаунт =======
app.post('/accounts', async (req, res) => {
  const { email, steamLogin, googlePassword, steamPassword, purchased } = req.body;

  try {
    const account = new Account({
      email,
      steamLogin, // Додано Логін Steam
      googlePassword,
      steamPassword,
      purchased
    });

    await account.save();
    res.status(201).json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка при збереженні акаунта', error: err.message });
  }
});

// ======= Роут: Змінити статус купівлі =======
app.put('/accounts/:id/toggle', async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Акаунт не знайдено' });

    account.purchased = !account.purchased;
    await account.save();
    res.json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка при оновленні акаунта', error: err.message });
  }
});

// ======= Запуск сервера =======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер працює на порту ${PORT}`);
});
