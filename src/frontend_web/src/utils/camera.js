// Lightweight camera utilities to centralize permission checks and safe getUserMedia
export async function queryCameraPermission() {
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'camera' });
      return status.state; // 'granted' | 'denied' | 'prompt'
    } catch (err) {
      return 'unsupported';
    }
  }
  return 'unsupported';
}

export async function listVideoDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'videoinput');
  } catch (err) {
    throw err;
  }
}

export async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(t => t.stop());
    return 'granted';
  } catch (err) {
    if (err && err.name === 'NotAllowedError') return 'denied';
    return 'prompt';
  }
}

export async function safeGetUserMedia(constraints) {
  const perm = await queryCameraPermission();
  if (perm === 'denied') {
    const e = new Error('Permission denied');
    e.name = 'NotAllowedError';
    throw e;
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}
