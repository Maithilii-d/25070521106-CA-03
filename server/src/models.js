import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, default: 'Wellness' },
  emoji: { type: String, default: '🌱' },
  target: { type: Number, default: 1, min: 1 },
  completedDates: { type: [String], default: [] }
}, { timestamps: true });

const moodSchema = new mongoose.Schema({
  mood: { type: String, required: true },
  note: { type: String, default: '', maxlength: 1000 },
  date: { type: String, required: true }
}, { timestamps: true });

const dailyLogSchema = new mongoose.Schema({
  date: { type: String, required: true },
  waterGlasses: { type: Number, default: 0, min: 0, max: 100 },
  waterGoal: { type: Number, default: 8, min: 1, max: 30 },
  sleepHours: { type: Number, default: 0, min: 0, max: 24 },
  steps: { type: Number, default: 0, min: 0, max: 200000 },
  exerciseMinutes: { type: Number, default: 0, min: 0, max: 1440 },
  routine: { type: [String], default: [] }
}, { timestamps: true });

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  emoji: String,
  duration: Number,
  joinedAt: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  waterGoal: { type: Number, default: 8 },
  habits: { type: [habitSchema], default: [] },
  moods: { type: [moodSchema], default: [] },
  logs: { type: [dailyLogSchema], default: [] },
  challenges: { type: [challengeSchema], default: [] },
  routineItems: { type: [String], default: ['Drink a glass of water', 'Take a mindful pause', 'Move for 10 minutes'] },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
