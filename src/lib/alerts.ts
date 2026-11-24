// Sound + vibration for the end of the rest timer.
//
// iPhone notes:
// - Safari on iOS has no navigator.vibrate. On iOS 18+ toggling a hidden
//   <input type="checkbox" switch> produces a short haptic tap, used as a fallback.
// - Web Audio must be "unlocked" by a user tap, so unlockAudio() is called when a set is marked done.
//   The end beep is then scheduled on the audio clock so it fires on time even if JS timers lag.

type AudioCtor = typeof AudioContext
let ctx: AudioContext | null = null
let scheduled: OscillatorNode[] = []

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
      if (!AC) return
      // Mix with music the user is listening to instead of stopping it.
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
      if (session) session.type = 'transient'
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
  } catch {
    /* audio not available */
  }
}

/** Schedule 3 short beeps at wall-clock time `atMs`. Replaces any earlier schedule. */
export function scheduleBeep(atMs: number) {
  cancelBeep()
  if (!ctx) return
  const delay = (atMs - Date.now()) / 1000
  if (delay < -0.5) return
  if (ctx.state === 'suspended') void ctx.resume()
  const t0 = ctx.currentTime + Math.max(0, delay)
  for (let i = 0; i < 3; i++) {
    const t = t0 + i * 0.28
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = i === 2 ? 1320 : 880
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.6, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.22)
    scheduled.push(osc)
  }
}

export function cancelBeep() {
  for (const o of scheduled) {
    try {
      o.stop()
      o.disconnect()
    } catch {
      /* already stopped */
    }
  }
  scheduled = []
}

function iosHapticTap() {
  try {
    const label = document.createElement('label')
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)
    label.style.display = 'none'
    document.body.appendChild(label)
    label.click()
    label.remove()
  } catch {
    /* not supported */
  }
}

export function vibrate() {
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate([250, 120, 250, 120, 400])
    return
  }
  ;[0, 180, 360, 540].forEach((d) => window.setTimeout(iosHapticTap, d))
}
