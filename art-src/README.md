# Art Source Files - Character System V2

This directory contains all source files for sprites, animations, and visual assets used in the new PixiJS-based character rendering system.

---

## 📁 Directory Structure

```
art-src/
├── characters/         # Character sprite source files
│   ├── base/          # Base character bodies
│   ├── hair/          # Hairstyle cosmetics
│   ├── outfits/       # Outfit/armor cosmetics
│   ├── weapons/       # Weapon cosmetics
│   └── accessories/   # Hats, glasses, etc.
├── monsters/          # Monster sprite source files
│   ├── tank/          # High HP, low damage monsters
│   ├── balanced/      # Balanced monsters
│   └── glass-cannon/  # Low HP, high damage monsters
├── effects/           # Particle effects, impacts
├── backgrounds/       # Battle backgrounds
└── ASEPRITE-WORKFLOW.md  # Complete workflow guide
```

---

## 🎨 File Format

**Primary Tool:** Aseprite (.ase, .aseprite)
- Preserves layers, tags, and animation data
- Industry standard for pixel art
- Required for the export workflow

### Naming Conventions

```
{category}-{name}-{variant}.ase

Examples:
- character-hero-base.ase
- character-knight-outfit.ase
- monster-golem-tank.ase
- weapon-sword-iron.ase
```

**Rules:**
- All lowercase
- Hyphens for spaces
- Descriptive names
- Include variant if applicable

---

## 📤 Export Workflow

1. **Create/Edit** sprite in Aseprite
2. **Tag** animations (idle, walk, attack, etc.)
3. **Export** sprite sheet + JSON to `/public/sprites/`
4. **Convert** JSON to SpriteMeta format
5. **Test** at `/character-system-v2/test`

See [ASEPRITE-WORKFLOW.md](./ASEPRITE-WORKFLOW.md) for complete instructions.

---

## 🎯 Canonical Specifications

### Frame Size
- **Default:** 32×32 pixels
- **High Detail:** 48×48 pixels (use consistently)

### Frame Rate
- **Default:** 12 FPS
- **Smooth motion:** 16-24 FPS
- **Slow motion:** 6-8 FPS

### Animation Tags
Must use exact names (case-sensitive):
- `idle` - Standing still
- `walk` - Walking cycle
- `attack` - Basic attack
- `hit` - Taking damage
- `victory` - Celebration
- `defend` - Blocking
- `support` - Healing gesture
- `heroic_strike` - Power attack

### Color Palettes

**Documented Palettes:**
```
Skin Tones:
- Light:  #fbbf24, #f59e0b, #d97706
- Medium: #d97706, #b45309, #92400e
- Dark:   #92400e, #78350f, #451a03

Hair Colors:
- Blonde:  #fbbf24, #f59e0b, #d97706
- Brown:   #92400e, #78350f, #451a03
- Black:   #374151, #1f2937, #111827
- Red:     #dc2626, #b91c1c, #991b1b

Outfit Colors (Primary):
- Blue:    #3b82f6, #2563eb, #1e40af
- Red:     #ef4444, #dc2626, #b91c1c
- Green:   #10b981, #059669, #047857
- Purple:  #8b5cf6, #7c3aed, #6d28d9
```

---

## ✅ Quality Standards

### Before Committing

- [ ] File is named correctly
- [ ] Canvas is exact pixel size (32×32 or 48×48)
- [ ] All animations are tagged
- [ ] Layers are organized and named
- [ ] Colors match documented palettes
- [ ] Transparent background (no white)
- [ ] Exported to `/public/sprites/`
- [ ] Metadata JSON generated
- [ ] Tested in `/character-system-v2/test`

### Git LFS

Large binary files (.ase, .png > 1MB) should use Git LFS:

```bash
git lfs track "*.ase"
git lfs track "*.aseprite"
```

Already configured in `.gitattributes`.

---

## 🔄 Version Control

### Source Files

**DO commit:**
- ✅ `.ase` / `.aseprite` source files
- ✅ Exported sprite sheets (`.png`)
- ✅ Metadata JSON files
- ✅ Documentation updates

**DON'T commit:**
- ❌ Backup files (`*.ase~`)
- ❌ Temporary exports
- ❌ Work-in-progress experiments (use branches)

### Changelog

Update `/public/sprites/CHANGELOG.md` when:
- Adding new sprites
- Modifying existing sprites
- Changing frame counts or animations
- Bumping version numbers

---

## 🎨 Creating Your First Sprite

**Quick Start (5 minutes):**

1. Open Aseprite
2. New file: 32×32 px, RGBA, transparent
3. Draw a simple character (stick figure is fine!)
4. Create 4 frames for idle animation
5. Tag frames as `idle`
6. Export to `/public/sprites/characters/v2/test-hero.png`
7. Export JSON data
8. Run conversion script (see workflow doc)
9. Test at `/character-system-v2/test`

**Full Workflow:** See [ASEPRITE-WORKFLOW.md](./ASEPRITE-WORKFLOW.md)

---

## 📚 Resources

### Learning Pixel Art
- **Lospec Tutorials:** https://lospec.com/pixel-art-tutorials
- **MortMort YouTube:** https://www.youtube.com/c/MortMort
- **Brandon James Greer:** https://www.youtube.com/@BJGpixel

### Aseprite Documentation
- **Official Docs:** https://www.aseprite.org/docs/
- **Animation Guide:** https://www.aseprite.org/docs/animation/
- **Sprite Sheet Export:** https://www.aseprite.org/docs/cli/#sprite-sheet

### Color Palettes
- **Lospec Palette List:** https://lospec.com/palette-list
- **DawnBringer Palettes:** Standard palettes for pixel art

---

## 🚨 Important Notes

### Separate Development Track

This is part of **Phase 8: Character System V2**, which is built completely separately from the main application:

- ✅ Build in isolation
- ✅ Test without affecting production
- ✅ Deploy only when Phase 8.4 is complete
- ✅ Beta testers unaffected until cutover

### File Size Guidelines

- **Individual sprites:** < 50 KB
- **Texture atlas:** < 512 KB
- **Total sprite budget:** < 5 MB (including all cosmetics)

If files are larger, consider:
- Reducing frame count
- Using smaller canvas (32×32 instead of 48×48)
- Combining into texture atlas
- Optimizing PNG compression

---

## 🔧 Troubleshooting

### "File won't commit"
- Check Git LFS is installed
- Verify `.gitattributes` includes `*.ase`
- File may be too large (>100 MB hard limit)

### "Aseprite won't open file"
- Ensure file extension is `.ase` or `.aseprite`
- Check file isn't corrupted (try older version)
- Verify Aseprite version is up to date

### "Export looks wrong"
- Double-check export settings (horizontal strip, no padding)
- Ensure JSON export is enabled
- Verify all frames are included in export range

---

**Need Help?** See [ASEPRITE-WORKFLOW.md](./ASEPRITE-WORKFLOW.md) for complete documentation.

**Test Your Sprites:** Navigate to `/character-system-v2/test` to see your work in action!
