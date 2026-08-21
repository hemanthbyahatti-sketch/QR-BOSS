import qrcode
from PIL import Image, ImageColor, ImageDraw


def blend_color(color1, color2, factor):
    c1 = ImageColor.getrgb(color1)
    c2 = ImageColor.getrgb(color2)
    return tuple(int(c1[i] + (c2[i] - c1[i]) * factor) for i in range(3))


data = "https://example.com"
fg = "#ff6b81"
bg = "#f7d794"
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=3)
qr.add_data(data)
qr.make(fit=True)
matrix = qr.get_matrix()
modules = len(matrix)
size = 700
pixel_size = size // (modules + 2 * qr.border)
canvas_size = pixel_size * (modules + 2 * qr.border)
image = Image.new("RGB", (canvas_size, canvas_size), bg)
draw = ImageDraw.Draw(image)
for row_index, row in enumerate(matrix):
    for col_index, module in enumerate(row):
        if not module:
            continue
        x0 = (col_index + qr.border) * pixel_size
        y0 = (row_index + qr.border) * pixel_size
        x1 = x0 + pixel_size
        y1 = y0 + pixel_size
        color = blend_color(fg, bg, row_index / max(1, modules - 1))
        draw.rectangle([x0, y0, x1, y1], fill=color)
image.save("generated_qr.png")
print("generated_qr.png created")
