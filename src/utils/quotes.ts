export const MOTIVATIONAL_QUOTES = [
  "Believe you can and you're halfway there.",
  "Your time is limited, don't waste it living someone else's life.",
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Don't count the days, make the days count.",
  "The future depends on what you do today.",
  "It always seems impossible until it's done.",
  "Don't wait. The time will never be just right.",
  "Action is the foundational key to all success.",
  "Do what you can, with what you have, where you are.",
  "Hardships often prepare ordinary people for an extraordinary destiny.",
  "Dream big and dare to fail.",
  "Everything you've ever wanted is on the other side of fear.",
  "Success is walking from failure to failure with no loss of enthusiasm.",
  "The best way to predict the future is to create it.",
  "You miss 100% of the shots you don't take.",
  "Whether you think you can or think you can't, you're right.",
  "A year from now you may wish you had started today.",
  "Don't be afraid to give up the good to go for the great.",
  "Small progress is still progress.",
  "Focus on being productive instead of busy.",
  "Your mind is for having ideas, not holding them.",
  "The secret of getting ahead is getting started.",
  "One day or day one. You decide.",
  "Discipline is choosing between what you want now and what you want most.",
  "Don't stop when you're tired. Stop when you're done.",
  "The only person you should try to be better than is the person you were yesterday.",
  "Be so good they can't ignore you.",
  "Winners never quit and quitters never win.",
  "Life is 10% what happens to me and 90% of how I react to it.",
  "Challenges are what make life interesting and overcoming them is what makes life meaningful.",
  "Don't let yesterday take up too much of today.",
  "You learn more from failure than from success. Don't let it stop you. Failure builds character.",
  "Knowing is not enough; we must apply. Wishing is not enough; we must do.",
  // Game of Thrones
  "There is only one thing we say to death: not today.",
  "Never forget what you are. The rest of the world will not. Wear it like armor.",
  "Chaos isn't a pit. Chaos is a ladder.",
  "A lion does not concern himself with the opinion of sheep.",
  "I am the blood of the dragon. I must be strong.",
  // One Piece
  "If you don't take risks, you can't create a future.",
  "No matter how hard or impossible it is, never lose sight of your goal.",
  "When do you think people die? When they are forgotten.",
  "I want to live!",
  "If I give up now, I'm going to regret it.",
  "Being lonely is more painful than getting hurt.",
  "You can't get back what you lose, but you can fight for what you still have.",
  "The man with the most freedom on the sea is the Pirate King.",
  // Best of anime
  "Power comes in response to a need, not a desire.",
  "Push through the pain. Giving up hurts more.",
  "Go beyond! Plus Ultra!",
  "Keep your heart burning, no matter how weak you feel.",
  "Whatever you lose, you'll find it again. But what you throw away, you'll never get back.",
  // Attack on Titan
  "Keep moving forward.",
  "If you don't fight, you can't win.",
  "Dedicate your heart.",
  "This world is cruel, but also very beautiful.",
  "Someone who can't sacrifice anything can't change anything.",
  "The only thing we're allowed to do is believe we won't regret the choice we made.",
  // Suits
  "Don't raise your voice. Improve your argument.",
  "Winners don't make excuses.",
  "I don't have dreams, I have goals.",
  "Success is my only option. Failure is not.",
  "When you're backed against the wall, break the damn thing down.",
  "The only time success comes before work is in the dictionary.",
  "I don't play the odds. I play the man.",
  "You want to lose small. I want to win big.",
];

export const getDailyQuote = (allQuotes?: string[]): string => {
  const pool = allQuotes && allQuotes.length > 0 ? allQuotes : MOTIVATIONAL_QUOTES;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor(start.getTime() / 86400000);
  return pool[Math.abs(dayIndex) % pool.length];
};

export const mergeQuotes = (customQuotes: string[]): string[] => {
  const seen = new Set(MOTIVATIONAL_QUOTES.map((q) => q.toLowerCase()));
  const uniqueCustom = customQuotes.filter((q) => {
    const key = q.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...uniqueCustom, ...MOTIVATIONAL_QUOTES];
};
