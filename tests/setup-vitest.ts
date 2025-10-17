import { AudioContext as TestAudioContext, OfflineAudioContext as TestOfflineAudioContext } from 'web-audio-test-api'

const globalScope = globalThis as unknown as Record<string, unknown>

globalScope.AudioContext = TestAudioContext as unknown
globalScope.OfflineAudioContext = TestOfflineAudioContext as unknown
