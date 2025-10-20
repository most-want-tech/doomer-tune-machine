/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Audio file validation utilities for cross-platform compatibility
 */

/**
 * Supported audio file formats with their MIME types and extensions
 */
export const SUPPORTED_AUDIO_FORMATS = {
  // Common formats with broad browser support
  mp3: {
    mimeTypes: ['audio/mpeg', 'audio/mp3'],
    extensions: ['.mp3'],
    description: 'MP3',
  },
  wav: {
    mimeTypes: ['audio/wav', 'audio/wave', 'audio/x-wav'],
    extensions: ['.wav'],
    description: 'WAV',
  },
  ogg: {
    mimeTypes: ['audio/ogg', 'audio/vorbis'],
    extensions: ['.ogg', '.oga'],
    description: 'OGG',
  },
  // Additional formats that Web Audio API can decode
  m4a: {
    mimeTypes: ['audio/mp4', 'audio/x-m4a', 'audio/m4a'],
    extensions: ['.m4a', '.mp4'],
    description: 'M4A/MP4',
  },
  aac: {
    mimeTypes: ['audio/aac', 'audio/aacp', 'audio/x-aac'],
    extensions: ['.aac'],
    description: 'AAC',
  },
  flac: {
    mimeTypes: ['audio/flac', 'audio/x-flac'],
    extensions: ['.flac'],
    description: 'FLAC',
  },
  webm: {
    mimeTypes: ['audio/webm'],
    extensions: ['.webm'],
    description: 'WebM',
  },
} as const

/**
 * Maximum file size in bytes (100MB)
 * Large audio files can cause memory issues in the browser
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024

/**
 * Get all supported MIME types as a flat array
 */
export function getSupportedMimeTypes(): string[] {
  return Object.values(SUPPORTED_AUDIO_FORMATS)
    .flatMap(format => format.mimeTypes)
}

/**
 * Get all supported file extensions as a flat array
 */
export function getSupportedExtensions(): string[] {
  return Object.values(SUPPORTED_AUDIO_FORMATS)
    .flatMap(format => format.extensions)
}

/**
 * Get a human-readable list of supported formats for display
 */
export function getSupportedFormatsDescription(): string {
  return Object.values(SUPPORTED_AUDIO_FORMATS)
    .map(format => format.description)
    .join(', ')
}

/**
 * Get the accept attribute value for file input
 * Includes both MIME types and extensions for maximum compatibility
 */
export function getAcceptAttribute(): string {
  const mimeTypes = getSupportedMimeTypes()
  const extensions = getSupportedExtensions()
  return [...mimeTypes, ...extensions].join(',')
}

/**
 * Extract file extension from filename (including the dot)
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.slice(lastDot).toLowerCase()
}

/**
 * Check if a file extension is supported
 */
function isExtensionSupported(extension: string): boolean {
  return getSupportedExtensions().includes(extension)
}

/**
 * Check if a MIME type is supported
 */
function isMimeTypeSupported(mimeType: string): boolean {
  return getSupportedMimeTypes().includes(mimeType)
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
  warning?: string
}

/**
 * Validate an audio file for upload
 * 
 * This function performs comprehensive validation including:
 * - File size check (prevents memory issues)
 * - MIME type validation (when available)
 * - File extension validation (fallback for systems with unreliable MIME types)
 * 
 * @param file - The file to validate
 * @returns Validation result with error/warning messages
 */
export function validateAudioFile(file: File): FileValidationResult {
  // Check file size first (most important for preventing crashes)
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty. Please select a valid audio file.',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = Math.round(file.size / 1024 / 1024)
    const maxSizeMB = Math.round(MAX_FILE_SIZE / 1024 / 1024)
    return {
      isValid: false,
      error: `File is too large (${sizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
    }
  }

  // Get file extension as a fallback validation method
  const extension = getFileExtension(file.name)
  
  // Check MIME type (primary validation)
  // Note: Some operating systems (especially Linux) may not set MIME types correctly
  const hasMimeType = file.type && file.type.length > 0
  const mimeTypeValid = hasMimeType && isMimeTypeSupported(file.type)
  
  // Check extension (fallback validation)
  const extensionValid = isExtensionSupported(extension)

  // If we have a MIME type and it's valid, file is good
  if (mimeTypeValid) {
    return { isValid: true }
  }

  // If no MIME type but extension is valid, file is probably good
  // This handles cases where the OS doesn't set MIME types
  if (!hasMimeType && extensionValid) {
    return {
      isValid: true,
      warning: 'File type detection unavailable. Validating by extension.',
    }
  }

  // If MIME type exists but is not in our list, but extension is valid
  // This handles cases where the OS sets an unusual MIME type
  if (hasMimeType && !mimeTypeValid && extensionValid) {
    return {
      isValid: true,
      warning: `Unknown MIME type "${file.type}". Accepting based on file extension.`,
    }
  }

  // File is not valid
  const supportedFormats = getSupportedFormatsDescription()
  return {
    isValid: false,
    error: `Please upload a valid audio file. Supported formats: ${supportedFormats}`,
  }
}

// Export YouTube utilities
export { 
  extractVideoId, 
  isValidYouTubeUrl, 
  downloadYouTubeAudio,
  type YouTubeVideoInfo 
} from './youtube'
