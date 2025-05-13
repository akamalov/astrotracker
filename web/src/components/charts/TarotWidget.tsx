import React from 'react';

// Mapping of Sun sign to Major Arcana Tarot card
const SUN_SIGN_TO_TAROT = {
  Aries: {
    name: 'The Emperor',
    number: 'IV',
    meaning: 'Authority, structure, control, fatherhood. Take charge of your life and act with confidence.'
  },
  Taurus: {
    name: 'The Hierophant',
    number: 'V',
    meaning: 'Tradition, spiritual wisdom, conformity. Seek guidance from established sources or mentors.'
  },
  Gemini: {
    name: 'The Lovers',
    number: 'VI',
    meaning: 'Love, harmony, choices, alignment of values. Make choices that align with your true self.'
  },
  Cancer: {
    name: 'The Chariot',
    number: 'VII',
    meaning: 'Willpower, victory, assertion, determination. Harness your emotions to achieve your goals.'
  },
  Leo: {
    name: 'Strength',
    number: 'VIII',
    meaning: 'Courage, persuasion, influence, compassion. Face challenges with inner strength and grace.'
  },
  Virgo: {
    name: 'The Hermit',
    number: 'IX',
    meaning: 'Introspection, solitude, guidance. Take time for self-reflection and seek inner wisdom.'
  },
  Libra: {
    name: 'Justice',
    number: 'XI',
    meaning: 'Fairness, truth, law, cause and effect. Seek balance and act with integrity.'
  },
  Scorpio: {
    name: 'Death',
    number: 'XIII',
    meaning: 'Transformation, endings, change, transition. Embrace transformation and let go of the old.'
  },
  Sagittarius: {
    name: 'Temperance',
    number: 'XIV',
    meaning: 'Balance, moderation, patience, purpose. Blend different aspects of your life in harmony.'
  },
  Capricorn: {
    name: 'The Devil',
    number: 'XV',
    meaning: 'Bondage, materialism, temptation. Recognize unhealthy attachments and reclaim your power.'
  },
  Aquarius: {
    name: 'The Star',
    number: 'XVII',
    meaning: 'Hope, inspiration, renewal, spirituality. Have faith in the future and trust your intuition.'
  },
  Pisces: {
    name: 'The Moon',
    number: 'XVIII',
    meaning: 'Illusion, intuition, dreams, subconscious. Listen to your inner voice and navigate uncertainty.'
  },
};

// Major Arcana by number (1-22)
const MAJOR_ARCANA = [
  null, // 0 is The Fool, but most systems start at 1
  { name: 'The Magician', number: 'I', meaning: 'Manifestation, resourcefulness, power, inspired action.' },
  { name: 'The High Priestess', number: 'II', meaning: 'Intuition, unconscious, inner voice, mystery.' },
  { name: 'The Empress', number: 'III', meaning: 'Femininity, beauty, nature, nurturing, abundance.' },
  { name: 'The Emperor', number: 'IV', meaning: 'Authority, structure, control, fatherhood.' },
  { name: 'The Hierophant', number: 'V', meaning: 'Tradition, spiritual wisdom, conformity.' },
  { name: 'The Lovers', number: 'VI', meaning: 'Love, harmony, relationships, values alignment.' },
  { name: 'The Chariot', number: 'VII', meaning: 'Willpower, victory, assertion, determination.' },
  { name: 'Strength', number: 'VIII', meaning: 'Courage, persuasion, influence, compassion.' },
  { name: 'The Hermit', number: 'IX', meaning: 'Introspection, solitude, guidance.' },
  { name: 'Wheel of Fortune', number: 'X', meaning: 'Change, cycles, fate, decisive moments.' },
  { name: 'Justice', number: 'XI', meaning: 'Fairness, truth, law, cause and effect.' },
  { name: 'The Hanged Man', number: 'XII', meaning: 'Pause, surrender, letting go, new perspective.' },
  { name: 'Death', number: 'XIII', meaning: 'Transformation, endings, change, transition.' },
  { name: 'Temperance', number: 'XIV', meaning: 'Balance, moderation, patience, purpose.' },
  { name: 'The Devil', number: 'XV', meaning: 'Bondage, materialism, temptation.' },
  { name: 'The Tower', number: 'XVI', meaning: 'Sudden change, upheaval, chaos, revelation.' },
  { name: 'The Star', number: 'XVII', meaning: 'Hope, inspiration, renewal, spirituality.' },
  { name: 'The Moon', number: 'XVIII', meaning: 'Illusion, intuition, dreams, subconscious.' },
  { name: 'The Sun', number: 'XIX', meaning: 'Positivity, fun, warmth, success, vitality.' },
  { name: 'Judgement', number: 'XX', meaning: 'Judgement, rebirth, inner calling, absolution.' },
  { name: 'The World', number: 'XXI', meaning: 'Completion, integration, accomplishment, travel.' },
  { name: 'The Fool', number: '0', meaning: 'Beginnings, innocence, spontaneity, a free spirit.' },
];

function getTarotBirthCards(birthDate: string) {
  // Accepts YYYY-MM-DD or ISO string
  if (!birthDate) return [];
  const date = new Date(birthDate);
  if (isNaN(date.getTime())) return [];
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // Sum all digits
  const sum = (y.toString() + m.toString().padStart(2, '0') + d.toString().padStart(2, '0'))
    .split('')
    .map(Number)
    .reduce((a, b) => a + b, 0);
  // First card: reduce to 22 or less
  let first = sum;
  while (first > 22) {
    first = first.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }
  // If sum is 10-22, show both sum and reduced; if 1-9, just one card
  const cards = [];
  if (sum !== first && sum <= 22) {
    cards.push(MAJOR_ARCANA[sum]);
  }
  if (first > 0 && first <= 22) {
    cards.push(MAJOR_ARCANA[first]);
  }
  return cards.filter(Boolean);
}

interface TarotWidgetProps {
  sunSign: string;
  birthDate: string;
}

const TarotWidget: React.FC<TarotWidgetProps> = ({ sunSign, birthDate }) => {
  const card = SUN_SIGN_TO_TAROT[sunSign as keyof typeof SUN_SIGN_TO_TAROT];
  const birthCards = getTarotBirthCards(birthDate);
  return (
    <div className="w-full mb-16">
      <div className="text-pink-300 font-bold text-lg mb-2 ml-1">Tarot Insight</div>
      {/* Cards Row */}
      <div className="flex flex-row gap-8 items-start justify-start max-w-[500px] mx-0">
        {/* Sun Sign Card */}
        <div className="flex items-center justify-center w-32 h-40 bg-gray-800 rounded-lg shadow-inner p-2">
          {card ? (
            <span className="text-2xl font-bold text-gray-300 w-full text-center" style={{ letterSpacing: '0.05em' }}>{card.number}</span>
          ) : (
            <span className="text-lg font-bold text-pink-400 text-center w-full">?</span>
          )}
        </div>
        {/* Birth Date Card */}
        <div className="flex items-center justify-center w-32 h-40 bg-gray-800 rounded-lg shadow-inner p-2">
          {birthCards.length > 0 ? (
            <span className="text-2xl font-bold text-gray-300 w-full text-center" style={{ letterSpacing: '0.05em' }}>{birthCards[0].number}</span>
          ) : (
            <span className="text-lg font-bold text-pink-400 text-center w-full">?</span>
          )}
        </div>
      </div>
      {/* Card Names Row */}
      <div className="flex flex-row gap-8 items-start justify-start max-w-[500px] mx-0 mt-2">
        <div className="w-32">
          <div className="text-purple-300 font-bold text-base mb-1">Your Sun Sign Tarot Card</div>
          <div className="text-blue-200 font-bold text-lg mb-1" style={{ letterSpacing: '0.02em' }}>{sunSign}</div>
          {card && <div className="text-xl font-bold text-gray-100 text-left" style={{ letterSpacing: '0.01em' }}>{card.name}</div>}
        </div>
        <div className="w-32">
          <div className="text-purple-300 font-bold text-base mb-1">Your Birth Date Tarot Card</div>
          <div className="mb-1" style={{ height: '28px', visibility: 'hidden' }}></div>
          {birthCards.length > 0 && <div className="text-xl font-bold text-gray-100 text-left" style={{ letterSpacing: '0.01em' }}>{birthCards[0].name}</div>}
        </div>
      </div>
      {/* Meanings Row */}
      <div className="flex flex-row gap-8 items-start justify-start max-w-[500px] mx-0 mt-1">
        <div className="w-32">
          {card && <div className="text-gray-300 text-left" style={{ maxWidth: 220 }}>{card.meaning}</div>}
        </div>
        <div className="w-32">
          {birthCards.length > 0 && <div className="text-gray-300 text-left" style={{ maxWidth: 220 }}>{birthCards[0].meaning}</div>}
          {birthCards.length === 0 && <div className="bg-gray-900 rounded-md p-4 text-left text-gray-200 w-28 mt-2">No Tarot card found for this birth date.</div>}
        </div>
      </div>
    </div>
  );
};

export default TarotWidget; 