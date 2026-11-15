from PIL import Image

im = Image.open(r'C:\Users\wellf\.gemini\antigravity\brain\a50d2dcc-15f6-4969-af5e-f588423d1e8c\shelf_crop.png')
# find dark pixels on the wood surface (wood is ~ (220, 160, 90))
w, h = im.size
print('Crop size:', w, h)
for y in range(0, h, 10):
    row = []
    for x in range(0, w, 20):
        r, g, b = im.getpixel((x, y))[:3]
        if r < 100 and g < 100 and b < 100:
            row.append('#')
        elif r > 180 and g > 130 and b < 120:
            row.append('.') # wood
        else:
            row.append(' ')
    line = ''.join(row)
    if '#' in line or '.' in line:
        print(f'{y:3d}: {line}')

