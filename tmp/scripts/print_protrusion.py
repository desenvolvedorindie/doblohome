from PIL import Image

im = Image.open(r'C:\Users\wellf\.gemini\antigravity\brain\a50d2dcc-15f6-4969-af5e-f588423d1e8c\crop_protrusion_hires.png')
w, h = im.size
print('Size:', w, h)
for y in range(0, h, 2):
    line = []
    for x in range(0, w, 2):
        r, g, b = im.getpixel((x, y))[:3]
        if r < 80 and g < 80 and b < 80:
            line.append('#')
        elif r > 180 and g > 130 and b < 120:
            line.append('.')
        elif r > 100 and g > 100 and b > 100:
            line.append('+')
        else:
            line.append(' ')
    print(f'{y:2d}: ' + ''.join(line))

