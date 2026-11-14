import os
import qrcode
from PIL import Image, ImageColor, ImageDraw, ImageTk
import tkinter as tk
from tkinter import filedialog, messagebox, colorchooser

DEFAULT_PALETTES = {
    "Sunset": ("#ff5f6d", "#ffc371"),
    "Ocean": ("#00f59b", "#00d2ff"),
    "Neon Pink": ("#ff0055", "#ffd000"),
    "Violet Flame": ("#9d4edd", "#ff007f"),
    "Solar Pop": ("#ff7700", "#ff0055"),
}
STYLE_OPTIONS = ["Classic", "Rounded", "Gradient", "Two-tone"]


def blend_color(color1, color2, factor):
    c1 = ImageColor.getrgb(color1)
    c2 = ImageColor.getrgb(color2)
    return tuple(int(c1[i] + (c2[i] - c1[i]) * factor) for i in range(3))


def create_qr_image(data, fg_color, bg_color, style, size=700):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=3,
    )
    qr.add_data(data)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    modules = len(matrix)
    pixel_size = size // (modules + 2 * qr.border)
    canvas_size = pixel_size * (modules + 2 * qr.border)
    image = Image.new("RGB", (canvas_size, canvas_size), bg_color)
    draw = ImageDraw.Draw(image)

    for row_index, row in enumerate(matrix):
        for col_index, module in enumerate(row):
            if not module:
                continue
            x0 = (col_index + qr.border) * pixel_size
            y0 = (row_index + qr.border) * pixel_size
            x1 = x0 + pixel_size
            y1 = y0 + pixel_size

            if style == "Rounded":
                draw.ellipse([x0, y0, x1, y1], fill=fg_color)
            elif style == "Gradient":
                gradient = blend_color(fg_color, bg_color, row_index / max(1, modules - 1))
                draw.rectangle([x0, y0, x1, y1], fill=gradient)
            elif style == "Two-tone":
                tone = blend_color(fg_color, bg_color, ((row_index + col_index) % 2) * 0.4)
                draw.rectangle([x0, y0, x1, y1], fill=tone)
            else:
                draw.rectangle([x0, y0, x1, y1], fill=fg_color)

    return image


def choose_color(default, title):
    chosen = colorchooser.askcolor(title=title, initialcolor=default)
    return chosen[1] if chosen[1] else default


def pick_palette(event=None):
    palette_name = palette_var.get()
    if palette_name in DEFAULT_PALETTES:
        fg, bg = DEFAULT_PALETTES[palette_name]
        fg_color_var.set(fg)
        bg_color_var.set(bg)
        fg_button.config(bg=fg)
        bg_button.config(bg=bg)


def generate_qr():
    data = text_input.get("1.0", tk.END).strip()
    if not data:
        messagebox.showwarning("Missing Text", "Please enter the text or URL for the QR code.")
        return

    fg_color = fg_color_var.get() or "#1a1a1a"
    bg_color = bg_color_var.get() or "#ffffff"
    style = style_var.get()
    output_path = filedialog.asksaveasfilename(
        defaultextension=".png",
        filetypes=[("PNG Image", "*.png")],
        title="Save QR Code",
        initialfile="stylish_qr.png",
    )
    if not output_path:
        return

    try:
        qr_image = create_qr_image(data, fg_color, bg_color, style)
        qr_image.save(output_path)
        messagebox.showinfo("Saved", f"QR code saved to:\n{output_path}")
        show_preview(qr_image)
    except Exception as exc:
        messagebox.showerror("Error", f"Could not create QR code:\n{exc}")


def show_preview(qr_image):
    preview_size = 280
    preview = qr_image.resize((preview_size, preview_size), Image.LANCZOS)
    preview_photo = ImageTk.PhotoImage(preview)
    preview_label.config(image=preview_photo)
    preview_label.image = preview_photo


def random_palette():
    name = next(iter(DEFAULT_PALETTES))
    if palette_var.get() in DEFAULT_PALETTES:
        keys = list(DEFAULT_PALETTES.keys())
        current = keys.index(palette_var.get()) if palette_var.get() in keys else -1
        name = keys[(current + 1) % len(keys)]
    palette_var.set(name)
    pick_palette()


def pick_color(color_var, button, title):
    new_color = choose_color(color_var.get(), title)
    color_var.set(new_color)
    button.config(bg=new_color)


def main():
    global root, palette_var, fg_color_var, bg_color_var, style_var
    global fg_button, bg_button, preview_label, text_input

    root = tk.Tk()
    root.title("Stylish QR Code Generator")
    root.geometry("760x600")
    root.resizable(False, False)
    root.configure(bg="#0c0d12")

    title_label = tk.Label(root, text="Stylish QR Code Generator", font=("Segoe UI", 22, "bold"), fg="#ff0055", bg="#0c0d12")
    title_label.pack(pady=(16, 8))

    frame = tk.Frame(root, bg="#141622", padx=18, pady=18, highlightbackground="#ff0055", highlightthickness=1)
    frame.pack(fill=tk.BOTH, expand=True, padx=16, pady=8)

    text_label = tk.Label(frame, text="Text or URL:", fg="#f8fafc", bg="#141622", font=("Segoe UI", 11, "bold"))
    text_label.grid(row=0, column=0, sticky="w")
    text_input = tk.Text(frame, width=48, height=6, bg="#1a1c28", fg="#f8fafc", insertbackground="#ff0055", wrap=tk.WORD, font=("Segoe UI", 10))
    text_input.grid(row=1, column=0, columnspan=2, pady=(4, 10), sticky="nsew")
    text_input.insert(tk.END, "https://example.com")

    palette_label = tk.Label(frame, text="Palette:", fg="#f8fafc", bg="#141622", font=("Segoe UI", 11, "bold"))
    palette_label.grid(row=2, column=0, sticky="w")
    palette_var = tk.StringVar(value="Sunset")
    palette_menu = tk.OptionMenu(frame, palette_var, *DEFAULT_PALETTES.keys(), command=pick_palette)
    palette_menu.config(bg="#222638", fg="#ffffff", highlightthickness=0, activebackground="#ff0055", activeforeground="#ffffff")
    palette_menu["menu"].config(bg="#222638", fg="#ffffff")
    palette_menu.grid(row=2, column=1, sticky="w", pady=(4, 10))

    fg_color_var = tk.StringVar(value=DEFAULT_PALETTES["Sunset"][0])
    bg_color_var = tk.StringVar(value=DEFAULT_PALETTES["Sunset"][1])

    fg_button = tk.Button(frame, text="Foreground", command=lambda: pick_color(fg_color_var, fg_button, "Choose foreground color"), bg=fg_color_var.get(), fg="#ffffff", font=("Segoe UI", 9, "bold"), width=14, relief="flat")
    fg_button.grid(row=3, column=0, sticky="w", pady=(0, 10))

    bg_button = tk.Button(frame, text="Background", command=lambda: pick_color(bg_color_var, bg_button, "Choose background color"), bg=bg_color_var.get(), fg="#ffffff", font=("Segoe UI", 9, "bold"), width=14, relief="flat")
    bg_button.grid(row=3, column=1, sticky="w", pady=(0, 10))

    style_label = tk.Label(frame, text="Style:", fg="#f8fafc", bg="#141622", font=("Segoe UI", 11, "bold"))
    style_label.grid(row=4, column=0, sticky="w")
    style_var = tk.StringVar(value=STYLE_OPTIONS[0])
    style_menu = tk.OptionMenu(frame, style_var, *STYLE_OPTIONS)
    style_menu.config(bg="#222638", fg="#ffffff", highlightthickness=0, activebackground="#ff0055", activeforeground="#ffffff")
    style_menu["menu"].config(bg="#222638", fg="#ffffff")
    style_menu.grid(row=4, column=1, sticky="w", pady=(4, 10))

    button_frame = tk.Frame(frame, bg="#141622")
    button_frame.grid(row=5, column=0, columnspan=2, pady=(10, 0), sticky="w")

    save_button = tk.Button(button_frame, text="Save QR Code", command=generate_qr, bg="#ff0055", fg="#ffffff", font=("Segoe UI", 10, "bold"), padx=16, pady=8, relief="flat", cursor="hand2")
    save_button.pack(side=tk.LEFT, padx=(0, 12))

    palette_button = tk.Button(button_frame, text="Next Palette", command=random_palette, bg="#ff7700", fg="#ffffff", font=("Segoe UI", 10, "bold"), padx=12, pady=8, relief="flat", cursor="hand2")
    palette_button.pack(side=tk.LEFT)

    preview_title = tk.Label(frame, text="Preview:", fg="#f8fafc", bg="#141622", font=("Segoe UI", 11, "bold"))
    preview_title.grid(row=6, column=0, sticky="w", pady=(16, 4))
    preview_label = tk.Label(frame, bg="#141622")
    preview_label.grid(row=7, column=0, columnspan=2, pady=(0, 8))

    frame.grid_columnconfigure(0, weight=1)
    frame.grid_columnconfigure(1, weight=1)

    pick_palette()
    show_preview(create_qr_image(text_input.get("1.0", tk.END).strip(), fg_color_var.get(), bg_color_var.get(), style_var.get()))
    root.mainloop()


if __name__ == "__main__":
    main()
