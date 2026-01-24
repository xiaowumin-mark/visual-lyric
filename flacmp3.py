import subprocess
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed
import os

# ===== 配置 =====
INPUT_DIR = Path("music")
OUTPUT_DIR = Path("mp3")
MAX_WORKERS = os.cpu_count() or 10  # 并行数
QUALITY = "0"  # LAME V0，约等于 320kbps

# ===============

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def convert(flac_path: Path):
    mp3_path = OUTPUT_DIR / (flac_path.stem + ".mp3")

    if mp3_path.exists():
        return f"Skip: {mp3_path.name}"

    cmd = [
        "ffmpeg",
        "-y",
        "-loglevel", "error",
        "-i", str(flac_path),
        "-map_metadata", "0",
        "-vn",
        "-c:a", "libmp3lame",
        "-q:a", QUALITY,
        str(mp3_path),
    ]

    try:
        subprocess.run(cmd, check=True)
        return f"OK: {flac_path.name}"
    except subprocess.CalledProcessError as e:
        return f"ERR: {flac_path.name} ({e})"


def main():
    flac_files = list(INPUT_DIR.rglob("*.flac"))

    if not flac_files:
        print("No flac files found.")
        return

    print(f"Found {len(flac_files)} flac files")
    print(f"Using {MAX_WORKERS} workers\n")

    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(convert, f) for f in flac_files]
        for future in as_completed(futures):
            print(future.result())


if __name__ == "__main__":
    main()
