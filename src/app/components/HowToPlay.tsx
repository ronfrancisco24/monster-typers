const STEPS = [
  'Type each letter of the word; a full word lands an attack.',
  'When "Defend!" appears, type the defense word before the timer ends.',
  'Break parts by completing break prompts for bonus materials.',
  'Alt+Tab pauses the fight; press Resume to continue.',
] as const;

export default function HowToPlayList() {
  return (
    <ul className="how-to-play">
      {STEPS.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ul>
  );
}
