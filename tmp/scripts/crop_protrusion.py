from PIL import Image

im = Image.open(r'C:\Users\wellf\.gemini\antigravity\brain\a50d2dcc-15f6-4969-af5e-f588423d1e8c\.user_uploaded\media_1794581101253_13c2ad41.jpg')
# The user screenshot size is 735x630
# The shelf protrusion:
# in shelf_crop (200, 150, 550, 450), the protrusion is around x=260-310, y=240-280
crop = im.crop((250, 230, 330, 290))
crop.save(r'C:\Users\wellf\.gemini\antigravity\brain\a50d2dcc-15f6-4969-af5e-f588423d1e8c\crop_protrusion_hires.png')
print('Protrusion saved.')

