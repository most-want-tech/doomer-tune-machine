# Planning Guide

A real-time audio processing application that transforms uploaded songs into "doomer" aesthetics through customizable audio effects, allowing users to experiment with various filters and export their creations.

**Experience Qualities**:
1. **Experimental** - Users should feel empowered to explore and manipulate audio in unconventional ways, discovering unique sonic textures
2. **Immediate** - Real-time audio processing provides instant feedback, making the creative process fluid and responsive
3. **Nostalgic** - The doomer aesthetic evokes melancholic, lo-fi feelings through degraded audio quality and vintage effects

**Complexity Level**: Light Application (multiple features with basic state)
  - The app focuses on real-time audio manipulation with multiple effect parameters, file upload/download, and preset management without requiring user accounts or complex data structures.

## Essential Features

### Audio File Upload
- **Functionality**: Drag-and-drop or click to upload audio files (MP3, WAV, OGG)
- **Purpose**: Provides the source material for doomer transformation
- **Trigger**: User clicks upload area or drags file into designated zone
- **Progression**: Select file → Validate format → Load into audio buffer → Display waveform visualization → Enable controls
- **Success criteria**: Audio loads within 2 seconds, waveform displays correctly, playback works smoothly

### Real-Time Effect Controls
- **Functionality**: Interactive sliders/switches for: Delay (feedback/time), Noise overlay, Low-pass filter, High-pass filter, Vinyl crackle simulator, Pitch shift, Playback speed
- **Purpose**: Allows precise tuning of the doomer aesthetic in real-time
- **Trigger**: User adjusts any control while audio is playing or paused
- **Progression**: Adjust control → Web Audio API processes effect → Hear result immediately → Fine-tune → Repeat
- **Success criteria**: Effects apply with <50ms latency, no audio crackling, smooth parameter transitions

### Playback Controls
- **Functionality**: Play, pause, stop, seek through timeline, volume control
- **Purpose**: Navigate and preview the transformed audio
- **Trigger**: User clicks play/pause button or drags timeline scrubber
- **Progression**: Click play → Audio plays with effects → Adjust timeline → Audio jumps to position → Pause when needed
- **Success criteria**: Smooth playback, accurate seeking, no audio glitches during effect changes

### Export Audio
- **Functionality**: Render and download processed audio as WAV file
- **Purpose**: Save the doomer mix for later use or sharing
- **Trigger**: User clicks "Export" button after achieving desired sound
- **Progression**: Click export → Show rendering progress → Process audio offline → Generate downloadable file → Auto-download or show save dialog
- **Success criteria**: Export completes within reasonable time (2-3x song length), maintains audio quality, no processing artifacts

### Preset Management
- **Functionality**: Save current effect settings as named preset, load presets, delete presets
- **Purpose**: Quick access to favorite doomer configurations
- **Trigger**: User clicks "Save Preset" after dialing in settings
- **Progression**: Adjust effects → Click save → Enter preset name → Store in local storage → Access via preset dropdown → Load anytime
- **Success criteria**: Presets persist between sessions, load instantly, accurately restore all parameters

## Edge Case Handling

- **Unsupported file format**: Display toast notification with supported formats, prevent upload
- **Large file uploads** (>50MB): Show loading indicator, consider file size warning
- **Audio processing errors**: Gracefully fallback, show error message, allow file re-upload
- **Extreme parameter values**: Clamp values to prevent audio distortion/clipping, normalize output
- **No file uploaded**: Disable all effect controls until file is loaded
- **Export during playback**: Pause playback automatically before rendering
- **Browser compatibility**: Check Web Audio API support on load, show warning if unsupported

## Design Direction

The design should feel melancholic, introspective, and slightly dystopian—evoking late-night bedroom producer vibes with a dark, muted aesthetic. A minimal interface serves the creative focus, keeping controls accessible without overwhelming the user.

## Color Selection

Monochromatic with cool accents - Creates a somber, focused atmosphere appropriate for the doomer aesthetic with hints of neon to suggest late-night creativity.

- **Primary Color**: Deep charcoal (oklch(0.25 0.01 265)) - Conveys seriousness and focus, grounding the interface
- **Secondary Colors**: Dark slate gray (oklch(0.35 0.015 265)) for cards/panels - Provides subtle depth without distraction
- **Accent Color**: Muted cyan (oklch(0.65 0.15 220)) for active controls and CTAs - Evokes old CRT monitors and late-night coding sessions
- **Foreground/Background Pairings**:
  - Background (Deep charcoal oklch(0.25 0.01 265)): Light gray text (oklch(0.9 0.01 265)) - Ratio 6.2:1 ✓
  - Card (Dark slate oklch(0.35 0.015 265)): Light gray text (oklch(0.9 0.01 265)) - Ratio 4.8:1 ✓
  - Primary (Muted cyan oklch(0.65 0.15 220)): Dark charcoal text (oklch(0.25 0.01 265)) - Ratio 5.1:1 ✓
  - Secondary (oklch(0.45 0.02 265)): White text (oklch(0.95 0 0)) - Ratio 5.8:1 ✓
  - Accent (Muted cyan oklch(0.65 0.15 220)): Deep charcoal (oklch(0.25 0.01 265)) - Ratio 5.1:1 ✓
  - Muted (oklch(0.3 0.01 265)): Muted gray text (oklch(0.65 0.01 265)) - Ratio 4.5:1 ✓

## Font Selection

Typography should feel technical yet approachable, reminiscent of audio software and DAWs while maintaining readability for extended creative sessions—using monospace for numerical values and sans-serif for UI elements.

- **Typographic Hierarchy**:
  - H1 (App Title): Space Grotesk Bold/32px/tight letter spacing - Modern, slightly technical feel
  - H2 (Section Headers): Space Grotesk Semibold/20px/normal spacing - Clear hierarchy
  - Body (Labels, descriptions): Inter Regular/14px/relaxed line height (1.6) - Excellent readability
  - Controls (Values, parameters): JetBrains Mono Regular/13px/monospace - Technical precision
  - Button Text: Inter Semibold/14px/wide letter spacing (0.02em) - Clear call to action

## Animations

Subtle and functional—motion should feel responsive without calling attention to itself, mirroring the smooth parameter changes in audio processing. Avoid excessive flourishes that might distract from the creative workflow.

- **Purposeful Meaning**: Smooth slider transitions mirror audio parameter interpolation, creating a sense of tactile control. Gentle fade-ins suggest audio loading states.
- **Hierarchy of Movement**: Effect control changes deserve the most attention (immediate visual feedback), followed by waveform animations (ambient background motion), and finally UI transitions (nearly invisible).

## Component Selection

- **Components**:
  - **Card**: Main container for upload zone, effect controls panel, and waveform display
  - **Button**: Play/pause/stop controls, export button, preset management
  - **Slider**: All effect parameters (delay, pitch, filters, etc.)
  - **Switch**: Binary effects (vinyl crackle on/off, noise on/off)
  - **Input**: Preset naming, numerical parameter entry
  - **Select**: Preset dropdown selector
  - **Dialog**: Preset save modal, export options
  - **Progress**: Audio loading, export rendering
  - **Separator**: Dividing effect groups visually
  - **Label**: All control labels with parameter values
  
- **Customizations**:
  - Custom waveform visualizer using Canvas API
  - Custom audio meter component for real-time level monitoring
  - Styled range inputs with value displays that update in real-time
  - Modified slider component with darker thumb and accent track color
  
- **States**:
  - Buttons: Disabled (muted gray) when no audio loaded, accent color on hover, slightly scaled on press
  - Sliders: Accent color for filled portion, smooth transitions on value change, show tooltip with exact value on hover
  - Switches: Accent glow when active, instant toggle animation
  - Upload zone: Dashed border normally, solid accent border on drag-over, subtle pulse animation when empty
  
- **Icon Selection**:
  - Play/Pause/Stop: Standard playback icons from phosphor-icons
  - Upload: CloudArrowUp for drag-drop zone
  - Export: DownloadSimple for export button
  - Sliders: Faders for effect controls
  - Presets: BookmarkSimple for save, FloppyDisk for presets
  - Waveform: Waveform icon next to audio display
  
- **Spacing**:
  - Container padding: p-6 (24px) for main cards
  - Control groups: space-y-4 (16px) between effect sections
  - Individual controls: space-y-2 (8px) within sections
  - Button gaps: gap-2 (8px) for action button groups
  - Section separators: my-6 (24px vertical margin)
  
- **Mobile**:
  - Stack effect controls vertically on mobile (<768px)
  - Reduce waveform height on small screens
  - Make sliders thumb larger for touch (20px vs 16px)
  - Convert horizontal control panel to accordion sections
  - Full-width buttons for better touch targets
  - Simplified waveform visualization (less detail) for performance
