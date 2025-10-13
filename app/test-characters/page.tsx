'use client';

import CustomizablePixelCharacter, { CharacterCustomization } from '../components/CustomizablePixelCharacter';

export default function TestCharactersPage() {
  const characters: { name: string; customization: CharacterCustomization }[] = [
    {
      name: 'Knight',
      customization: {
        bodyType: 'MUSCULAR',
        skinColor: '#fcc89b',
        hairStyle: 'SHORT',
        hairColor: '#8b4513',
        facialHair: 'NONE',
        outfit: 'KNIGHT',
        outfitColor: '#4b5563',
        accessoryColor: '#fbbf24',
      },
    },
    {
      name: 'Wizard',
      customization: {
        bodyType: 'AVERAGE',
        skinColor: '#fcc89b',
        hairStyle: 'LONG',
        hairColor: '#9ca3af',
        facialHair: 'BEARD',
        outfit: 'WIZARD',
        outfitColor: '#7c3aed',
        accessoryColor: '#fbbf24',
      },
    },
    {
      name: 'Ninja',
      customization: {
        bodyType: 'SLIM',
        skinColor: '#d4a574',
        hairStyle: 'SHORT',
        hairColor: '#1f2937',
        facialHair: 'NONE',
        outfit: 'NINJA',
        outfitColor: '#1f2937',
        accessoryColor: '#dc2626',
      },
    },
    {
      name: 'Armor',
      customization: {
        bodyType: 'BULKY',
        skinColor: '#8b6f47',
        hairStyle: 'MOHAWK',
        hairColor: '#dc2626',
        facialHair: 'STUBBLE',
        outfit: 'ARMOR',
        outfitColor: '#374151',
        accessoryColor: '#9ca3af',
      },
    },
    {
      name: 'Athletic',
      customization: {
        bodyType: 'MUSCULAR',
        skinColor: '#fcc89b',
        hairStyle: 'PONYTAIL',
        hairColor: '#1f2937',
        facialHair: 'NONE',
        outfit: 'ATHLETIC',
        outfitColor: '#3b82f6',
        accessoryColor: '#ffffff',
      },
    },
    {
      name: 'Casual',
      customization: {
        bodyType: 'AVERAGE',
        skinColor: '#d4a574',
        hairStyle: 'MEDIUM',
        hairColor: '#8b4513',
        facialHair: 'GOATEE',
        outfit: 'CASUAL',
        outfitColor: '#10b981',
        accessoryColor: '#ffffff',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-pixel text-4xl text-white mb-4 text-center">
          Enhanced Pixel Art Characters
        </h1>
        <p className="font-retro text-gray-300 text-center mb-8">
          Custom-built with pixel art best practices: outlines, 3-color shading, and detailed outfits
        </p>

        {/* Character Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          {characters.map((char) => (
            <div
              key={char.name}
              className="bg-gray-800 border-4 border-gray-600 rounded-lg p-6 flex flex-col items-center"
            >
              <h3 className="font-pixel text-xl text-white mb-4">{char.name}</h3>
              <div className="bg-gray-700 p-4 rounded">
                <CustomizablePixelCharacter
                  customization={char.customization}
                  size={160}
                  animationState="idle"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Animation States Demo */}
        <div className="bg-gray-800 border-4 border-gray-600 rounded-lg p-8 mb-8">
          <h2 className="font-pixel text-2xl text-white mb-6 text-center">
            Animation States - Knight
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['idle', 'attack', 'hit', 'victory'].map((state) => (
              <div key={state} className="flex flex-col items-center">
                <div className="bg-gray-700 p-4 rounded mb-2">
                  <CustomizablePixelCharacter
                    customization={characters[0].customization}
                    size={120}
                    animationState={state as 'idle' | 'attack' | 'hit' | 'victory'}
                  />
                </div>
                <p className="font-pixel text-sm text-gray-300">{state}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature List */}
        <div className="bg-gray-800 border-4 border-gray-600 rounded-lg p-8">
          <h2 className="font-pixel text-2xl text-white mb-4">✨ Features Implemented</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-pixel text-lg text-yellow-400 mb-3">Pixel Art Best Practices</h3>
              <ul className="font-retro text-sm text-gray-300 space-y-2">
                <li>✅ 1px black outlines on all elements</li>
                <li>✅ 3-color shading (base, highlight, shadow)</li>
                <li>✅ Consistent top-left light source</li>
                <li>✅ Readable silhouettes</li>
                <li>✅ 24x24 pixel grid for detail</li>
                <li>✅ Proper pixel clustering</li>
              </ul>
            </div>
            <div>
              <h3 className="font-pixel text-lg text-blue-400 mb-3">Detailed Outfits</h3>
              <ul className="font-retro text-sm text-gray-300 space-y-2">
                <li>⚔️ Knight: Full helmet, cape, breastplate, longsword</li>
                <li>🔮 Wizard: Tall pointed hat, stars, mystical staff</li>
                <li>🥷 Ninja: Face mask, headband, utility belt, katana</li>
                <li>🛡️ Armor: Chest plate, pauldrons, gauntlets, sword</li>
                <li>🏃 Athletic: Racing stripes, modern sportswear</li>
                <li>👕 Casual: Simple collar and buttons</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-900 rounded border border-gray-700">
            <h3 className="font-pixel text-lg text-green-400 mb-2">Next Steps</h3>
            <ul className="font-retro text-xs text-gray-400 space-y-1">
              <li>• Add 2-3 frame walk cycle animations</li>
              <li>• Create attack animation frames</li>
              <li>• Build character customization UI</li>
              <li>• Integrate into game pages (check-in, dashboard)</li>
              <li>• Connect to cosmetic unlock API</li>
              <li>• Add unlock notifications</li>
            </ul>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-8 bg-blue-900 border-4 border-blue-700 rounded-lg p-6">
          <h3 className="font-pixel text-xl text-white mb-3">🎨 Custom Pixel Art Decision</h3>
          <p className="font-retro text-sm text-blue-100 mb-4">
            After testing LPC (Liberated Pixel Cup) sprites, we decided to stick with custom-built
            canvas pixel art because:
          </p>
          <ul className="font-retro text-sm text-blue-100 space-y-2">
            <li>• LPC sprites were too realistic for the retro game aesthetic</li>
            <li>• LPC base pack lacked armor/clothing sprites</li>
            <li>• Custom canvas art perfectly matches the chunky pixel UI style</li>
            <li>• Full control over character class details (knight helmets, wizard hats, etc.)</li>
            <li>• Easier to add future customization options</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
