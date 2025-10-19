# Plan: Investigate Poor Export Audio Quality

## Current State / Problem Statement
- Users report that the rendered audio inside exported video files sounds noticeably worse than the in-app preview.
- Preview playback uses the real-time audio graph built in `use-audio-processor`, while exports rely on the offline rendering pipeline in `src/audio/offline-renderer.ts`.
- Mismatch between the two processing chains likely introduces artifacts (e.g., incorrect pitch, effect levels, or missing nodes) after export.

## Goals
- Reproduce the quality mismatch between preview playback and offline export.
- Identify the specific differences between the runtime audio graph and offline renderer that lead to degraded output.
- Implement fixes so that exported audio matches the preview as closely as possible.
- Add automated coverage (unit/integration) or documentation to prevent regressions.
- Extend the investigation to the video export pipeline, where the muxed audio still sounds glitchy despite the improved audio-only export.

## Proposed Investigation Steps
1. Review the real-time audio graph implementation (`src/hooks/use-audio-processor.ts`, `src/audio/audio-graph.ts`).
2. Review the offline rendering flow (`src/audio/offline-renderer.ts`) and export feature integration in `src/export/*`.
3. Compare node configuration between the two paths (ordering, parameter compensation, noise/vinyl sources, Tone.js PitchShift usage).
4. Verify whether playback rate and pitch shift compensation logic matches between preview and export.
5. Inspect how the offline renderer handles reverb tails, sample rate conversion, and additional effects.
6. Trace the video export pipeline (`src/video/video-exporter.ts`) to identify audio-specific transformations (resampling, bitrate changes, chunking) and how WebCodecs/mediabunny encode the track.
7. Reproduce the issue locally by exporting with non-default playback rate, pitch shift, or heavy effects, then compare:
	- Preview vs. audio-only export vs. muxed video export.
	- Spectrogram/time-domain analysis for each variant to pinpoint artifacts (aliasing, buffer gaps, clipping).

## Potential Fix Directions (Hypotheses)
- Offline renderer may be missing the pitch compensation applied during live playback when playback rate differs from 1.0.
- Noise/vinyl sources might be mixed differently (gain staging discrepancies).
- Reverb impulse generation or `stretchAudioBuffer` algorithm could produce artifacts.
- Video export currently downsamples to 22.05 kHz at 64 kbps; the combination of aggressive resampling, lossy bitrate, and chunk boundaries may introduce audible artifacts not present in the audio-only path.
- The chunk-based handoff to `AudioBufferSource.add` could be introducing discontinuities if timestamps or channel buffers are not perfectly aligned.

## Acceptance Criteria
- Exported audio closely matches the preview for combinations of playback rate, pitch shift, and enabled effects.
- Automated test(s) cover the corrected behaviour (e.g., verifying pitch compensation in offline render).
- Documentation (README or comments) updated if behaviour/usage changes.

## Next Steps / Tasks
- [ ] Create GitHub issue documenting the bug and referencing this plan.
- [ ] Create dedicated fix branch per workflow guidelines.
- [ ] Perform detailed code comparison and confirm hypotheses.
- [ ] Implement fixes in offline rendering path.
- [ ] Add regression tests.
- [ ] Manually verify export quality against preview.
- [ ] Audit video export audio handling and replicate any fixes needed for muxed output.
- [ ] Document codec/sample-rate decisions for both audio-only and video export flows.
- [ ] Submit PR referencing the issue.
