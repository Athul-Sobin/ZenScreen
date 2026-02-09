import { AppUsageData, PuzzleData, SleepRecord } from './types';

export const MOCK_APPS: AppUsageData[] = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', iconFamily: 'Ionicons', color: '#E1306C', category: 'Social', usageMinutes: 87, dailyLimit: 60, opens: 23, notifications: 45, isBlocked: false, isShortForm: true },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', iconFamily: 'Ionicons', color: '#FF0000', category: 'Entertainment', usageMinutes: 65, dailyLimit: 90, opens: 12, notifications: 8, isBlocked: false, isShortForm: true },
  { id: 'twitter', name: 'X (Twitter)', icon: 'logo-twitter', iconFamily: 'Ionicons', color: '#1DA1F2', category: 'Social', usageMinutes: 42, dailyLimit: 45, opens: 18, notifications: 32, isBlocked: false, isShortForm: false },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', iconFamily: 'Ionicons', color: '#FF2D55', category: 'Social', usageMinutes: 110, dailyLimit: 30, opens: 8, notifications: 15, isBlocked: false, isShortForm: true },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', iconFamily: 'Ionicons', color: '#25D366', category: 'Communication', usageMinutes: 35, dailyLimit: 120, opens: 40, notifications: 67, isBlocked: false, isShortForm: false },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', iconFamily: 'Ionicons', color: '#FFFC00', category: 'Social', usageMinutes: 28, dailyLimit: 30, opens: 15, notifications: 22, isBlocked: false, isShortForm: true },
  { id: 'chrome', name: 'Chrome', icon: 'logo-chrome', iconFamily: 'Ionicons', color: '#4285F4', category: 'Productivity', usageMinutes: 55, dailyLimit: 0, opens: 30, notifications: 5, isBlocked: false, isShortForm: false },
  { id: 'gmail', name: 'Gmail', icon: 'mail', iconFamily: 'Ionicons', color: '#EA4335', category: 'Productivity', usageMinutes: 18, dailyLimit: 0, opens: 12, notifications: 28, isBlocked: false, isShortForm: false },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', iconFamily: 'Ionicons', color: '#FF4500', category: 'Social', usageMinutes: 48, dailyLimit: 45, opens: 9, notifications: 11, isBlocked: false, isShortForm: false },
  { id: 'netflix', name: 'Netflix', icon: 'film', iconFamily: 'Ionicons', color: '#E50914', category: 'Entertainment', usageMinutes: 72, dailyLimit: 120, opens: 3, notifications: 2, isBlocked: false, isShortForm: false },
];

export const PUZZLES: PuzzleData[] = [
  { id: 'k1', type: 'knowledge', difficulty: 'easy', question: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 1, explanation: 'Mars appears red due to iron oxide on its surface.' },
  { id: 'k2', type: 'knowledge', difficulty: 'easy', question: 'How many continents are there on Earth?', options: ['5', '6', '7', '8'], correctAnswer: 2, explanation: 'The 7 continents are Asia, Africa, North America, South America, Antarctica, Europe, and Australia.' },
  { id: 'k3', type: 'knowledge', difficulty: 'medium', question: 'What is the smallest bone in the human body?', options: ['Femur', 'Stapes', 'Radius', 'Patella'], correctAnswer: 1, explanation: 'The stapes (stirrup) bone in the middle ear is the smallest bone.' },
  { id: 'k4', type: 'knowledge', difficulty: 'medium', question: 'Which element has the chemical symbol "Au"?', options: ['Silver', 'Aluminum', 'Gold', 'Argon'], correctAnswer: 2, explanation: 'Au comes from the Latin word "aurum" meaning gold.' },
  { id: 'k5', type: 'knowledge', difficulty: 'hard', question: 'What is the speed of light in km/s (approximately)?', options: ['150,000', '200,000', '300,000', '400,000'], correctAnswer: 2, explanation: 'Light travels at approximately 299,792 km/s.' },
  { id: 'l1', type: 'logic', difficulty: 'easy', question: 'If all roses are flowers and some flowers fade quickly, can we conclude all roses fade quickly?', options: ['Yes', 'No', 'Maybe', 'Not enough info'], correctAnswer: 1, explanation: 'Only "some" flowers fade quickly, so we cannot conclude all roses do.' },
  { id: 'l2', type: 'logic', difficulty: 'easy', question: 'What comes next: 2, 6, 12, 20, ?', options: ['28', '30', '32', '24'], correctAnswer: 1, explanation: 'The differences are 4, 6, 8, 10... so 20 + 10 = 30.' },
  { id: 'l3', type: 'logic', difficulty: 'medium', question: 'A bat and ball cost $1.10 together. The bat costs $1 more than the ball. How much is the ball?', options: ['$0.10', '$0.05', '$0.15', '$0.01'], correctAnswer: 1, explanation: 'If ball = $0.05, bat = $1.05. Total = $1.10. Not $0.10 as many think!' },
  { id: 'l4', type: 'logic', difficulty: 'medium', question: 'If 5 machines take 5 minutes to make 5 widgets, how long for 100 machines to make 100 widgets?', options: ['100 min', '5 min', '20 min', '50 min'], correctAnswer: 1, explanation: 'Each machine makes 1 widget in 5 minutes. 100 machines make 100 widgets in 5 minutes.' },
  { id: 'l5', type: 'logic', difficulty: 'hard', question: 'I have 3 doors. Behind one is a prize. You pick door 1, I open door 3 (no prize). Should you switch to door 2?', options: ['Yes, switch', 'No, stay', 'Makes no difference', 'Need more info'], correctAnswer: 0, explanation: 'The Monty Hall problem: switching gives you 2/3 chance of winning.' },
  { id: 'w1', type: 'word', difficulty: 'easy', question: 'What 5-letter word becomes shorter when you add 2 letters to it?', options: ['Short', 'Small', 'Tiny', 'Brief'], correctAnswer: 0, explanation: '"Short" becomes "shorter" when you add "er".' },
  { id: 'w2', type: 'word', difficulty: 'easy', question: 'Which word is an anagram of "LISTEN"?', options: ['TINSEL', 'SILENT', 'INSLET', 'NESTLE'], correctAnswer: 1, explanation: 'SILENT uses the exact same letters as LISTEN.' },
  { id: 'w3', type: 'word', difficulty: 'medium', question: 'What word can follow "sun", "moon", and "day"?', options: ['Light', 'Rise', 'Set', 'Time'], correctAnswer: 0, explanation: 'Sunlight, moonlight, and daylight are all valid compound words.' },
  { id: 'w4', type: 'word', difficulty: 'medium', question: 'Which word means both a flying mammal and a piece of sports equipment?', options: ['Club', 'Bat', 'Fly', 'Racket'], correctAnswer: 1, explanation: 'A bat is both the animal and the sports equipment.' },
  { id: 'w5', type: 'word', difficulty: 'hard', question: 'What 9-letter word still remains a word each time you remove a letter?', options: ['Startling', 'Splatters', 'Streaming', 'Strapping'], correctAnswer: 0, explanation: 'Startling > starting > staring > string > sting > sing > sin > in > I.' },
];

export function generateWeeklySleepData(): SleepRecord[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const records: SleepRecord[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const hours = 5.5 + Math.random() * 3.5;
    const bedHour = 22 + Math.floor(Math.random() * 3);
    const bedMin = Math.floor(Math.random() * 60);
    const wakeHour = bedHour + Math.floor(hours) - 24;
    const wakeMin = Math.floor((hours % 1) * 60);
    let quality: SleepRecord['quality'] = 'poor';
    if (hours >= 8) quality = 'excellent';
    else if (hours >= 7) quality = 'good';
    else if (hours >= 6) quality = 'fair';
    records.push({
      id: `sleep-${i}`,
      date: days[d.getDay()],
      bedtime: `${bedHour > 23 ? bedHour - 24 : bedHour}:${bedMin.toString().padStart(2, '0')}`,
      wakeTime: `${Math.max(0, wakeHour)}:${wakeMin.toString().padStart(2, '0')}`,
      durationHours: parseFloat(hours.toFixed(1)),
      quality,
    });
  }
  return records;
}

export function getPuzzlesForTier(tier: 1 | 2 | 3, usedIds: string[]): PuzzleData[] {
  const available = PUZZLES.filter(p => !usedIds.includes(p.id));
  if (tier === 1) {
    const easy = available.filter(p => p.difficulty === 'easy');
    return easy.length > 0 ? [easy[Math.floor(Math.random() * easy.length)]] : [available[0]];
  }
  if (tier === 2) {
    const hard = available.filter(p => p.difficulty === 'hard' || p.difficulty === 'medium');
    const shuffled = hard.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(2, shuffled.length));
  }
  const medium = available.filter(p => p.difficulty === 'medium' || p.difficulty === 'easy');
  const shuffled = medium.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}
