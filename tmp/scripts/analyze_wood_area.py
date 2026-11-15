from PIL import Image

im = Image.open(r'C:\Users\wellf\.gemini\antigravity\brain\a50d2dcc-15f6-4969-af5e-f588423d1e8c\shelf_crop.png')
w, h = im.size
for y in range(40, 150, 4):
    line = []
    for x in range(30, 200, 3):
        r, g, b = im.getpixel((x, y))[:3]
        if r < 120 and g < 120 and b < 120:
            line.append('#')
        elif r > 160 and g > 120 and b < 130:
            line.append('.')
        else:
            line.append(' ')
    s = ''.join(line)
    if '#' in s:
        print(f'{y:3d}: {s}')

