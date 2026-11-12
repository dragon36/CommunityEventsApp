import struct
import zlib
import base64

def create_png(width=512, height=512, color=(66, 133, 244, 255)):
    """Create a simple PNG with solid color."""
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk - solid color image data
    # Create scanlines (one byte filter type + width * 4 bytes per pixel)
    scanline = b'\x00' + bytes(color) * width
    raw_data = scanline * height
    compressed = zlib.compress(raw_data)
    idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png

# Create all required PNG files
for name in ['icon.png', 'adaptive-icon.png', 'favicon.png', 'splash.png', 'splash-dark.png', 'notification-icon.png', 'logo.png']:
    with open(name, 'wb') as f:
        f.write(create_png())
    print(f'Created {name}')

# Create notification sound
with open('notification.wav', 'wb') as f:
    # Simple WAV header for 1 second of silence
    f.write(b'RIFF')
    f.write(struct.pack('<I', 44 + 44100 * 2 - 8))  # file size - 8
    f.write(b'WAVE')
    f.write(b'fmt ')
    f.write(struct.pack('<I', 16))  # PCM
    f.write(struct.pack('<H', 1))   # mono
    f.write(struct.pack('<I', 44100))  # sample rate
    f.write(struct.pack('<I', 88200))  # byte rate
    f.write(struct.pack('<H', 2))   # block align
    f.write(struct.pack('<H', 16))  # bits per sample
    f.write(b'data')
    f.write(struct.pack('<I', 44100 * 2))  # data size
    f.write(b'\x00' * (44100 * 2))  # silence
print('Created notification.wav')
