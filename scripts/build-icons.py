from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "xiaofeiniu-logo-source.jpg"
SAFE_SCALE = 0.88


def build_icon(size: int) -> Path:
    with Image.open(SOURCE) as source:
        square_size = min(source.size)
        square = ImageOps.fit(source.convert("RGB"), (square_size, square_size), method=Image.Resampling.LANCZOS)

    subject_size = round(size * SAFE_SCALE)
    subject = square.resize((subject_size, subject_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size), "#000000")
    offset = (size - subject_size) // 2
    canvas.paste(subject, (offset, offset))

    output = ROOT / "assets" / f"icon-{size}.png"
    canvas.save(output, format="PNG", optimize=True)
    return output


if __name__ == "__main__":
    for icon_size in (180, 192, 512):
        print(build_icon(icon_size))
