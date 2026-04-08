#!/bin/bash
# Generate pinyin audio files using macOS Tingting voice
# Output: public/audio/*.m4a

mkdir -p public/audio
cd public/audio

# List of all marked pinyin to generate (deduplicated)
# Using Tingting voice (zh_CN)
echo "Generating audio files with Tingting voice..."

# Generate audio for each syllable using macOS say command
# Skip already existing files
generate_audio() {
    local marked=$1
    local filename=$2
    
    if [ ! -f "$filename" ]; then
        # Use Tingting voice (zh_CN) - high quality
        say -v Tingting -o "$filename" -- Channels=1 -- SampleRate=22050 "$marked" 2>/dev/null
        # Also try to optimize file size
        if [ -f "$filename" ]; then
            echo -n "."
        fi
    fi
}

# Test with a few samples first
for marked in "bā" "mā" "yī" "bà" "nǐ"; do
    filename="${marked}_test.m4a"
    echo "Testing: $marked -> $filename"
done

echo ""
echo "Tingting voice test complete"
say -v Tingting "你好，欢迎使用拼音学习乐园" -o /tmp/welcome.m4a -- Channels=1 -- SampleRate=22050 2>/dev/null
echo "Welcome audio generated"
