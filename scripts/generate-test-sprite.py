#!/usr/bin/env python3
"""
Generate a simple test sprite sheet for the LPC character system.
This creates a basic 64x64 pixel character sprite with multiple frames and directions.
"""

from PIL import Image, ImageDraw

# LPC sprite sheet standard dimensions
FRAME_WIDTH = 64
FRAME_HEIGHT = 64
COLS = 4  # 4 animation frames per row
ROWS = 12  # 12 rows (4 walk directions + 4 attack + 4 special)

# Colors
TRANSPARENT = (0, 0, 0, 0)
SKIN_COLOR = (255, 200, 160, 255)
SKIN_DARK = (200, 150, 120, 255)
EYE_COLOR = (50, 50, 50, 255)

def create_sprite_sheet(output_path: str, primary_color: tuple, secondary_color: tuple = None):
    """Create a sprite sheet with a simple character"""

    # Create blank sprite sheet
    width = FRAME_WIDTH * COLS
    height = FRAME_HEIGHT * ROWS
    sprite_sheet = Image.new('RGBA', (width, height), TRANSPARENT)
    draw = ImageDraw.Draw(sprite_sheet)

    if secondary_color is None:
        secondary_color = primary_color

    # Draw each frame
    for row in range(ROWS):
        for col in range(COLS):
            x_offset = col * FRAME_WIDTH
            y_offset = row * FRAME_HEIGHT

            # Character is centered in the 64x64 frame
            center_x = x_offset + FRAME_WIDTH // 2
            center_y = y_offset + FRAME_HEIGHT // 2

            # Animation offset (for walk cycle)
            anim_offset = 0
            if col == 1:
                anim_offset = -2
            elif col == 3:
                anim_offset = 2

            # Head (12x12 circle approximation)
            head_y = center_y - 8
            draw.ellipse(
                [center_x - 6, head_y - 6, center_x + 6, head_y + 6],
                fill=SKIN_COLOR,
                outline=SKIN_DARK,
                width=1
            )

            # Eyes
            draw.ellipse(
                [center_x - 4, head_y - 2, center_x - 2, head_y],
                fill=EYE_COLOR
            )
            draw.ellipse(
                [center_x + 2, head_y - 2, center_x + 4, head_y],
                fill=EYE_COLOR
            )

            # Body (16x20 rectangle)
            body_top = head_y + 8
            body_bottom = body_top + 20
            draw.rectangle(
                [center_x - 8, body_top, center_x + 8, body_bottom],
                fill=primary_color,
                outline=secondary_color,
                width=2
            )

            # Arms
            arm_y = body_top + 5
            # Left arm
            draw.rectangle(
                [center_x - 12, arm_y + anim_offset, center_x - 8, arm_y + 12 + anim_offset],
                fill=SKIN_COLOR,
                outline=SKIN_DARK,
                width=1
            )
            # Right arm
            draw.rectangle(
                [center_x + 8, arm_y - anim_offset, center_x + 12, arm_y + 12 - anim_offset],
                fill=SKIN_COLOR,
                outline=SKIN_DARK,
                width=1
            )

            # Legs (with walk animation)
            leg_top = body_bottom
            leg_bottom = leg_top + 12
            leg_offset_left = anim_offset
            leg_offset_right = -anim_offset

            # Left leg
            draw.rectangle(
                [center_x - 6, leg_top + leg_offset_left, center_x - 2, leg_bottom + leg_offset_left],
                fill=primary_color,
                outline=secondary_color,
                width=1
            )
            # Right leg
            draw.rectangle(
                [center_x + 2, leg_top + leg_offset_right, center_x + 6, leg_bottom + leg_offset_right],
                fill=primary_color,
                outline=secondary_color,
                width=1
            )

    # Save the sprite sheet
    sprite_sheet.save(output_path, 'PNG')
    print(f"Created sprite sheet: {output_path}")

def create_hair_layer(output_path: str):
    """Create a hair layer sprite sheet"""
    width = FRAME_WIDTH * COLS
    height = FRAME_HEIGHT * ROWS
    sprite_sheet = Image.new('RGBA', (width, height), TRANSPARENT)
    draw = ImageDraw.Draw(sprite_sheet)

    hair_color = (80, 50, 20, 255)  # Brown

    for row in range(ROWS):
        for col in range(COLS):
            x_offset = col * FRAME_WIDTH
            y_offset = row * FRAME_HEIGHT
            center_x = x_offset + FRAME_WIDTH // 2
            center_y = y_offset + FRAME_HEIGHT // 2
            head_y = center_y - 8

            # Hair on top of head
            draw.ellipse(
                [center_x - 8, head_y - 10, center_x + 8, head_y - 2],
                fill=hair_color
            )
            # Side hair
            draw.rectangle(
                [center_x - 8, head_y - 4, center_x - 6, head_y + 4],
                fill=hair_color
            )
            draw.rectangle(
                [center_x + 6, head_y - 4, center_x + 8, head_y + 4],
                fill=hair_color
            )

    sprite_sheet.save(output_path, 'PNG')
    print(f"Created hair layer: {output_path}")

def create_accessory_layer(output_path: str):
    """Create an accessory layer (hat)"""
    width = FRAME_WIDTH * COLS
    height = FRAME_HEIGHT * ROWS
    sprite_sheet = Image.new('RGBA', (width, height), TRANSPARENT)
    draw = ImageDraw.Draw(sprite_sheet)

    hat_color = (200, 0, 0, 255)  # Red

    for row in range(ROWS):
        for col in range(COLS):
            x_offset = col * FRAME_WIDTH
            y_offset = row * FRAME_HEIGHT
            center_x = x_offset + FRAME_WIDTH // 2
            center_y = y_offset + FRAME_HEIGHT // 2
            head_y = center_y - 8

            # Hat top
            draw.ellipse(
                [center_x - 6, head_y - 16, center_x + 6, head_y - 10],
                fill=hat_color
            )
            # Hat brim
            draw.ellipse(
                [center_x - 10, head_y - 12, center_x + 10, head_y - 8],
                fill=hat_color
            )

    sprite_sheet.save(output_path, 'PNG')
    print(f"Created accessory layer: {output_path}")

if __name__ == '__main__':
    import os

    # Create output directory
    output_dir = 'public/sprites'
    os.makedirs(output_dir, exist_ok=True)

    # Generate sprite sheets
    create_sprite_sheet(
        f'{output_dir}/base-male.png',
        (220, 180, 140, 255),  # Skin tone for body
        (180, 140, 100, 255)   # Darker outline
    )

    create_sprite_sheet(
        f'{output_dir}/shirt-basic.png',
        (65, 105, 225, 255),   # Blue shirt
        (40, 80, 200, 255)     # Darker blue outline
    )

    create_hair_layer(f'{output_dir}/hair-short.png')
    create_accessory_layer(f'{output_dir}/hat-cap.png')

    # Create a simple weapon layer
    width = FRAME_WIDTH * COLS
    height = FRAME_HEIGHT * ROWS
    weapon_sheet = Image.new('RGBA', (width, height), TRANSPARENT)
    draw = ImageDraw.Draw(weapon_sheet)

    for row in range(4, 8):  # Only in attack rows
        for col in range(COLS):
            x_offset = col * FRAME_WIDTH
            y_offset = row * FRAME_HEIGHT
            center_x = x_offset + FRAME_WIDTH // 2
            center_y = y_offset + FRAME_HEIGHT // 2

            # Sword extending to the right
            sword_x = center_x + 8 + (col * 2)  # Extends more each frame
            draw.rectangle(
                [sword_x, center_y - 1, sword_x + 16, center_y + 1],
                fill=(192, 192, 192, 255)  # Silver blade
            )
            draw.ellipse(
                [sword_x - 4, center_y - 3, sword_x, center_y + 3],
                fill=(139, 69, 19, 255)  # Brown handle
            )

    weapon_sheet.save(f'{output_dir}/weapon-sword.png', 'PNG')
    print(f"Created weapon layer: {output_dir}/weapon-sword.png")

    print("\n✅ All sprite sheets generated successfully!")
    print("You can now test the sprite system at http://localhost:3002/test-sprites")
