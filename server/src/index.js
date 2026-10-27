import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models.js';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-change-me';

const todayKey = () => new Date().toLocaleDateString('en-CA');
function tokenFor(user) { return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' }); }
function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email, waterGoal: user.waterGoal,
    habits: user.habits, moods: user.moods, logs: user.logs, challenges: user.challenges,
    routineItems: user.routineItems, createdAt: user.createdAt };
}
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user;
    next();
  } catch { return res.status(401).json({ message: 'Session expired. Please log in again.' }); }
}
function ensureLog(user, date = todayKey()) {
  let log = user.logs.find(item => item.date === date);
  if (!log) {
    log = { date, waterGlasses: 0, waterGoal: user.waterGoal || 8, sleepHours: 0, steps: 0, exerciseMinutes: 0, routine: [] };
    user.logs.push(log);
  }
  return log;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Wellnest API' }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Use a password with at least 6 characters.' });
    if (await User.findOne({ email: email.toLowerCase().trim() })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash,
      habits: [
        { title: 'Drink water', category: 'Health', emoji: '💧', target: 1, completedDates: [] },
        { title: 'Move your body', category: 'Movement', emoji: '🏃', target: 1, completedDates: [] },
        { title: 'Read for 10 minutes', category: 'Mind', emoji: '📚', target: 1, completedDates: [] },
        { title: 'Take a mindful pause', category: 'Mindfulness', emoji: '🌿', target: 1, completedDates: [] }
      ] });
    res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
  } catch (e) { res.status(500).json({ message: 'Could not create account.', detail: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    res.json({ token: tokenFor(user), user: safeUser(user) });
  } catch (e) { res.status(500).json({ message: 'Could not log in.', detail: e.message }); }
});

app.get('/api/me', auth, (req, res) => res.json({ user: safeUser(req.user) }));

app.patch('/api/profile', auth, async (req, res) => {
  const { name, waterGoal } = req.body;
  if (name?.trim()) req.user.name = name.trim();
  if (waterGoal !== undefined) {
    const goal = Number(waterGoal);
    if (!Number.isFinite(goal) || goal < 1 || goal > 30) return res.status(400).json({ message: 'Water goal must be between 1 and 30 glasses.' });
    req.user.waterGoal = goal;
    req.user.logs.forEach(log => { log.waterGoal = goal; });
  }
  await req.user.save();
  res.json({ user: safeUser(req.user) });
});

app.post('/api/habits', auth, async (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ message: 'Habit title is required.' });
  req.user.habits.push({ title, category: req.body.category || 'Wellness', emoji: req.body.emoji || '🌱', target: 1, completedDates: [] });
  await req.user.save(); res.status(201).json({ user: safeUser(req.user) });
});
app.patch('/api/habits/:id/toggle', auth, async (req, res) => {
  const habit = req.user.habits.id(req.params.id);
  if (!habit) return res.status(404).json({ message: 'Habit not found.' });
  const date = req.body.date || todayKey();
  habit.completedDates = habit.completedDates.includes(date) ? habit.completedDates.filter(d => d !== date) : [...habit.completedDates, date];
  await req.user.save(); res.json({ user: safeUser(req.user) });
});
app.delete('/api/habits/:id', auth, async (req, res) => {
  req.user.habits.pull({ _id: req.params.id }); await req.user.save(); res.json({ user: safeUser(req.user) });
});

app.post('/api/moods', auth, async (req, res) => {
  const { mood, note = '', date = todayKey() } = req.body;
  if (!mood) return res.status(400).json({ message: 'Choose a mood first.' });
  req.user.moods.push({ mood, note: String(note).slice(0, 1000), date });
  await req.user.save(); res.status(201).json({ user: safeUser(req.user) });
});

app.patch('/api/logs/today', auth, async (req, res) => {
  const log = ensureLog(req.user);
  const allowed = ['waterGlasses', 'sleepHours', 'steps', 'exerciseMinutes'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      const value = Number(req.body[key]);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: `Invalid value for ${key}.` });
      log[key] = value;
    }
  }
  log.waterGoal = req.user.waterGoal;
  await req.user.save(); res.json({ user: safeUser(req.user) });
});
app.patch('/api/routine', auth, async (req, res) => {
  if (!Array.isArray(req.body.items)) return res.status(400).json({ message: 'Routine items must be a list.' });
  req.user.routineItems = req.body.items.map(s => String(s).trim()).filter(Boolean).slice(0, 20);
  await req.user.save(); res.json({ user: safeUser(req.user) });
});

app.post('/api/challenges/:slug/join', auth, async (req, res) => {
  const catalog = {
    'hydration-week': ['Hydration Week', 'Reach your water goal each day.', '💧', 7],
    'mindful-minutes': ['Mindful Minutes', 'Make space for a short mindful pause.', '🧘', 5],
    'move-more': ['Move More', 'Record a little movement each day.', '👟', 7],
    'reading-reset': ['Reading Reset', 'Make time for a few pages.', '📚', 5]
  };
  const item = catalog[req.params.slug];
  if (!item) return res.status(404).json({ message: 'Challenge not found.' });
  if (!req.user.challenges.some(c => c.title === item[0])) req.user.challenges.push({ title: item[0], description: item[1], emoji: item[2], duration: item[3] });
  await req.user.save(); res.json({ user: safeUser(req.user) });
});
app.patch('/api/challenges/:id/complete', auth, async (req, res) => {
  const challenge = req.user.challenges.id(req.params.id);
  if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });
  challenge.completed = !challenge.completed;
  await req.user.save(); res.json({ user: safeUser(req.user) });
});

app.listen(PORT, async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wellnest');
    console.log(`✓ MongoDB connected: wellnest`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error('Check that MongoDB Community Server is installed and running.');
  }
  console.log(`Wellnest API running at http://localhost:${PORT}`);
});
