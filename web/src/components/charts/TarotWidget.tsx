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

interface TarotWidgetProps {
  sunSign: string;
}

const TarotWidget: React.FC<TarotWidgetProps> = ({ sunSign }) => {
  const card = SUN_SIGN_TO_TAROT[sunSign as keyof typeof SUN_SIGN_TO_TAROT];
  if (!card) {
    return (
      <div className="bg-gray-900 rounded-md p-4 text-center text-gray-200">
        <div className="text-lg font-bold text-pink-400 mb-2">Tarot Card</div>
        <div className="text-gray-400">No Tarot card mapping for this Sun sign.</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="text-blue-200 font-bold text-lg mb-2" style={{ letterSpacing: '0.02em' }}>{sunSign}</div>
      <div className="bg-gray-800 rounded-lg shadow-inner flex flex-col items-center justify-between w-28 h-36 mb-3 p-2">
        <div className="flex-1"></div>
        <span className="text-2xl font-bold text-gray-300 mb-1" style={{ letterSpacing: '0.05em' }}>{card.number}</span>
      </div>
      <div className="text-xl font-bold text-gray-100 mb-1 text-center" style={{ letterSpacing: '0.01em' }}>{card.name}</div>
      <div className="text-gray-300 text-center mt-2" style={{ maxWidth: 220 }}>{card.meaning}</div>
    </div>
  );
};

export default TarotWidget; 