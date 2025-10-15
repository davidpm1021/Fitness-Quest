# Aseprite Workflow - Character System V2

This guide explains how to create and export sprite sheets for the new PixiJS-based character rendering system.

---

## 🎨 Getting Started

### Requirements

- **Aseprite** ($19.99) - https://www.aseprite.org/
  - Industry-standard pixel art tool
  - Built-in animation support with tags
  - Sprite sheet export with metadata

### Canvas Setup

**Canonical Frame Size: 32×32 pixels**

For higher detail sprites, use 48×48 pixels, but be consistent across all sprites for a character.

```
Canvas Size: 32×32 pixels
Color Mode: RGBA
Background: Transparent
```

---

## 📐 Creating Your First Sprite

### 1. Create New File

1. Open Aseprite
2. File → New
3. Set dimensions: 32×32 pixels
4. Choose RGBA mode
5. Select transparent background

### 2. Design Guidelines

**Pixel Art Best Practices:**
- Use limited color palettes (8-16 colors)
- Avoid sub-pixel details
- Use dithering sparingly
- Maintain consistent line weights
- Keep outlines crisp (1px thick)

**Anatomy Guidelines:**
- Head: ~10-12px tall
- Body: ~16-18px tall
- Arms: ~8-10px long
- Legs: ~10-12px long
- Anchor point: Bottom-center of character

### 3. Create Base Idle Frame

Start with a simple idle stance:
- Character facing forward
- Feet planted
- Arms at sides or slightly forward
- Subtle breathing/bobbing for animation

---

## 🎬 Animation Setup

### Animation Tag Names

Use these **exact** tag names (case-sensitive):

| Tag Name | Description | Typical Frame Count |
|----------|-------------|---------------------|
| `idle` | Standing still, subtle breathing | 4-6 frames |
| `walk` | Walking cycle | 6-8 frames |
| `attack` | Weapon swing or strike | 6-8 frames |
| `hit` | Taking damage, recoil | 3-4 frames |
| `victory` | Celebration, arms raised | 4-6 frames |
| `defend` | Blocking or shielding | 3-4 frames |
| `support` | Healing gesture | 4-6 frames |
| `heroic_strike` | Powerful attack | 8-10 frames |

### Creating Animations

#### Example: Idle Animation (4 frames)

1. **Frame 1:** Base pose
2. **Frame 2:** Slight upward movement (breathing in)
3. **Frame 3:** Back to base pose
4. **Frame 4:** Slight downward movement (breathing out)

**Timing:** 12 FPS (default) = ~0.33 seconds per cycle

#### Example: Walk Animation (8 frames)

1. **Frame 1:** Contact (right foot forward)
2. **Frame 2:** Down (weight shifts)
3. **Frame 3:** Passing (left leg passes right)
4. **Frame 4:** Up (left leg raises)
5. **Frame 5:** Contact (left foot forward)
6. **Frame 6:** Down (weight shifts)
7. **Frame 7:** Passing (right leg passes left)
8. **Frame 8:** Up (right leg raises)

**Timing:** 12-16 FPS for smooth walking

### Tagging Animations in Aseprite

1. Open **Timeline** panel (View → Timeline)
2. Select the frames for your animation
3. Right-click on the timeline
4. Choose "New Tag"
5. Name the tag exactly as specified above (e.g., `idle`, `walk`)
6. Set repeat count to `Forward` for looping animations

---

## 🗂️ Layer Structure

### Modular Layer System

Create separate layers for each customizable element:

```
Layers (top to bottom):
├── weapon        # Sword, staff, bow
├── hair          # Hairstyle
├── outfit        # Shirt, armor
├── pants         # Legs, boots
├── base          # Body, skin, face
└── shadow        # (optional) Drop shadow
```

**Why Layers Matter:**
- Each layer can be exported separately
- Allows palette swapping (recoloring)
- Enables modular character customization
- Easy to swap cosmetics without re-drawing

### Layer Naming Conventions

- Use lowercase
- No spaces (use underscores: `long_hair`)
- Be descriptive: `knight_helmet`, `wizard_staff`

---

## 📤 Exporting Sprite Sheets

### Step 1: Export Sprite Sheet

1. File → Export → Export Sprite Sheet
2. **Layout** tab:
   - Type: `Horizontal Strip` (all frames in one row)
   - Padding: `0` pixels between frames
   - ☑ Trim Sprite (if needed)
3. **Sprite** tab:
   - ☑ Output File: `/public/sprites/characters/v2/hero-base.png`
4. **Output** tab:
   - ☑ JSON Data
   - Output File: `/public/sprites/characters/v2/hero-base.json`
   - JSON Format: `Array` (compatible with PixiJS)
   - ☑ Tags (include animation tags)
   - ☑ Layers (if exporting multi-layer)
5. Click **Export**

### Step 2: Verify Export

Check that you have:
- `hero-base.png` - Sprite sheet image
- `hero-base.json` - Metadata with animations

### Step 3: Convert JSON to SpriteMeta Format

Aseprite's export needs to be converted to our SpriteMeta format. Use this Node.js script:

```javascript
// scripts/convert-aseprite-json.js
const fs = require('fs');

function convertAsepriteToSpriteMeta(asepriteJson) {
  const { frames, meta } = JSON.parse(fs.readFileSync(asepriteJson, 'utf8'));

  const frameWidth = frames[0].frame.w;
  const frameHeight = frames[0].frame.h;
  const columns = meta.size.w / frameWidth;
  const rows = meta.size.h / frameHeight;

  // Extract animations from frame tags
  const animations = {};
  meta.frameTags.forEach(tag => {
    const frameIndices = [];
    for (let i = tag.from; i <= tag.to; i++) {
      frameIndices.push(i);
    }
    animations[tag.name] = frameIndices;
  });

  const spriteMeta = {
    frameWidth,
    frameHeight,
    columns,
    rows,
    animations,
    anchors: { x: 0.5, y: 0.9 }, // Bottom-center
    version: "1.0.0",
    fps: 12, // Default FPS
  };

  return spriteMeta;
}

// Usage:
const spriteMeta = convertAsepriteToSpriteMeta('./hero-base.json');
fs.writeFileSync('./hero-base-meta.json', JSON.stringify(spriteMeta, null, 2));
```

---

## 🎨 Palette Swapping

### Creating a Palette-Swappable Sprite

1. Use a consistent base palette
2. Document color codes:
   ```
   Skin Tone 1: #fbbf24
   Skin Tone 2: #f59e0b
   Skin Tone 3: #d97706

   Hair Color 1: #92400e
   Hair Color 2: #78350f
   Hair Color 3: #451a03
   ```
3. Use these exact colors in your sprite
4. The system will replace them at runtime

### Color Map Example

```typescript
const skinToneMap = [
  { from: '#fbbf24', to: '#d97706' }, // Light → Medium
  { from: '#f59e0b', to: '#b45309' },
];
```

---

## ✅ Quality Checklist

Before exporting, verify:

- [ ] Canvas is exactly 32×32 (or 48×48)
- [ ] All animations are tagged correctly
- [ ] Frame count is consistent (no missing frames)
- [ ] Anchor point is bottom-center
- [ ] Colors are from documented palette
- [ ] Transparent background (no white pixels)
- [ ] Outlines are crisp (no blur)
- [ ] Animations loop smoothly
- [ ] Exported JSON includes all tags
- [ ] Version number is updated

---

## 📁 File Organization

```
art-src/
├── characters/
│   ├── hero-base-idle.ase          # Aseprite source
│   ├── hero-base-walk.ase
│   ├── hero-outfit-knight.ase      # Cosmetic layer
│   └── hero-weapon-sword.ase       # Cosmetic layer
├── monsters/
│   └── tank-golem-idle.ase
└── ASEPRITE-WORKFLOW.md

public/sprites/characters/v2/
├── hero-base.png                   # Exported sprite sheet
├── hero-base.json                  # Metadata
├── knight-outfit.png
├── knight-outfit.json
├── sword-weapon.png
└── sword-weapon.json
```

---

## 🚀 Quick Start Example

### Create a Simple Idle Animation

1. **New File:** 32×32 px, RGBA, transparent
2. **Frame 1:** Draw character standing
3. **Frame 2-4:** Duplicate and adjust slightly (breathing)
4. **Tag:** Select all 4 frames, tag as `idle`
5. **Export:**
   - Sprite sheet: `public/sprites/characters/v2/test-hero.png`
   - JSON: `public/sprites/characters/v2/test-hero.json`
6. **Convert:** Run conversion script to generate SpriteMeta
7. **Test:** Navigate to `/character-system-v2/test` to see your sprite!

---

## 🔧 Troubleshooting

### Sprite looks blurry
- Ensure canvas is exact pixel size (32×32)
- Don't use anti-aliasing
- Check PixiJS is using nearest-neighbor filtering

### Animation not looping
- Verify tag exists in JSON export
- Check frame indices are sequential
- Ensure `loop: true` in SpriteRenderer

### Wrong colors
- Check palette map is correct
- Verify hex colors match exactly
- Ensure no color variations from anti-aliasing

### Sprite is cut off
- Adjust anchor point in metadata
- Ensure character fits within 32×32 canvas
- Check frame bounds in sprite sheet

---

## 📚 Resources

- **Aseprite Tutorials:** https://www.aseprite.org/docs/
- **Pixel Art Fundamentals:** https://lospec.com/pixel-art-tutorials
- **Color Palettes:** https://lospec.com/palette-list
- **Animation Principles:** "The Animator's Survival Kit" by Richard Williams

---

**Next:** After creating your first sprite, test it at `/character-system-v2/test`
