import argparse
from pathlib import Path
from urllib.parse import urlparse

import qrcode
from PIL.PngImagePlugin import PngInfo


def build_qr(url: str, output: Path) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError("分享网址必须是完整的 HTTPS 地址")

    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    image = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    metadata = PngInfo()
    metadata.add_text("URL", url)
    image.save(output, format="PNG", pnginfo=metadata)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="生成小飞牛计时分享二维码")
    parser.add_argument("url")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build_qr(args.url, args.output)
    print(args.output.resolve())
