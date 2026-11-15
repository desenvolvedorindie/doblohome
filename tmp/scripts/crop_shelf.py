from PIL import Image

im = Image.open(r'C:\Users\wellf\.gemini\antigravity\brain\a50d2dcc-15f6-4969-af5e-f588423d1e8c\.user_uploaded\media_1794581101253_13c2ad41.jpg')
# Crop around shelf
crop = im.crop((200, 150, 550, 450))
crop.save(r'C:\Users\wellf\.gemini\antigravity\brain\a50d2dcc-15f6-4969-af5e-f588423d1e8c\shelf_crop.png')
print('Saved shelf_crop.png')

