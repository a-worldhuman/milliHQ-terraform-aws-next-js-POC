export function size(obj) {
    const size = new TextEncoder().encode(JSON.stringify(obj)).length;
    const kiloBytes = size / 1024;
    const megaBytes = kiloBytes / 1024;
  
    return megaBytes;
}