#!/bin/bash
cd "public/data" || exit

echo "Zahajuji kompresi M4A souborů..."
find . -type f -name "*.m4a" | while read -r file; do
    echo "  -> Komprimuji $file..."
    ffmpeg -nostdin -y -i "$file" -c:a aac -b:a 48k "${file}.tmp.m4a" -loglevel warning
    if [ -f "${file}.tmp.m4a" ]; then
        mv "${file}.tmp.m4a" "$file"
    fi
done

echo "Zahajuji kompresi MP4 souborů..."
find . -type f -name "*.mp4" | while read -r file; do
    echo "  -> Komprimuji $file..."
    ffmpeg -nostdin -y -i "$file" -vcodec libx264 -crf 28 -preset fast -c:a aac -b:a 48k "${file}.tmp.mp4" -loglevel warning
    if [ -f "${file}.tmp.mp4" ]; then
        mv "${file}.tmp.mp4" "$file"
    fi
done

echo "Hotovo. Nová velikost složky:"
du -sh .
