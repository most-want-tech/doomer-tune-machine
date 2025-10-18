import { AudioContext as TestAudioContext, OfflineAudioContext as TestOfflineAudioContext } from 'web-audio-test-api'

const globalScope = globalThis as unknown as Record<string, unknown>

globalScope.AudioContext = TestAudioContext as unknown
globalScope.OfflineAudioContext = TestOfflineAudioContext as unknown

if (!('window' in globalScope)) {
	globalScope.window = globalScope
}

if (typeof globalScope.requestAnimationFrame !== 'function') {
	globalScope.requestAnimationFrame = ((_: FrameRequestCallback) => 1) as unknown
}

if (typeof globalScope.cancelAnimationFrame !== 'function') {
	globalScope.cancelAnimationFrame = (() => undefined) as unknown
}
