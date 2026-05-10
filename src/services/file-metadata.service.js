const FALLBACK_MIME_BY_TYPE = Object.freeze({
  photo: 'image/jpeg',
  voice: 'audio/ogg',
});

const FALLBACK_EXTENSION_BY_TYPE = Object.freeze({
  photo: 'jpg',
  video: 'mp4',
  animation: 'mp4',
  audio: 'mp3',
  voice: 'ogg',
});

const EXTENSION_BY_MIME = Object.freeze({
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
});

function normalizeMimeType(mimeType) {
  return String(mimeType || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
}

function getExtensionByMime(mimeType) {
  return EXTENSION_BY_MIME[normalizeMimeType(mimeType)] || '';
}

function buildFallbackFileName(type, message, mimeType) {
  const messageId = message?.message_id || 'unknown';
  const extension = getExtensionByMime(mimeType) || FALLBACK_EXTENSION_BY_TYPE[type] || '';
  const fileName = `${type}_${messageId}`;

  return extension ? `${fileName}.${extension}` : fileName;
}

function getPhotoScore(photo) {
  if (!photo) {
    return 0;
  }

  if (photo.file_size) {
    return photo.file_size;
  }

  return (photo.width || 0) * (photo.height || 0);
}

function getLargestPhoto(photos = []) {
  return photos.reduce((largestPhoto, photo) => {
    if (!largestPhoto || getPhotoScore(photo) > getPhotoScore(largestPhoto)) {
      return photo;
    }

    return largestPhoto;
  }, null);
}

function buildFileMetadata(type, file, message) {
  if (!file) {
    return null;
  }

  const mime = file.mime_type || FALLBACK_MIME_BY_TYPE[type] || '';

  return {
    type,
    name: file.file_name || buildFallbackFileName(type, message, mime),
    mime,
    size: file.file_size || null,
    fileId: file.file_id || '',
    fileUniqueId: file.file_unique_id || '',
  };
}

function extractTelegramFileMetadata(message) {
  if (!message) {
    return null;
  }

  if (message.document) {
    return buildFileMetadata('document', message.document, message);
  }

  if (Array.isArray(message.photo) && message.photo.length > 0) {
    return buildFileMetadata('photo', getLargestPhoto(message.photo), message);
  }

  if (message.video) {
    return buildFileMetadata('video', message.video, message);
  }

  if (message.animation) {
    return buildFileMetadata('animation', message.animation, message);
  }

  if (message.audio) {
    return buildFileMetadata('audio', message.audio, message);
  }

  if (message.voice) {
    return buildFileMetadata('voice', message.voice, message);
  }

  return null;
}

function formatValue(value) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return 'не указан';
  }

  return value;
}

function formatFileSize(fileSize) {
  if (!fileSize) {
    return 'не указан';
  }

  return `${fileSize} байт`;
}

function formatTelegramFileMetadata(metadata) {
  return [
    'Файл получен',
    '',
    `Тип: ${formatValue(metadata.type)}`,
    `Название: ${formatValue(metadata.name)}`,
    `Mime: ${formatValue(metadata.mime)}`,
    `Размер: ${formatFileSize(metadata.size)}`,
    `file_id: ${formatValue(metadata.fileId)}`,
    `file_unique_id: ${formatValue(metadata.fileUniqueId)}`,
  ].join('\n');
}

module.exports = {
  extractTelegramFileMetadata,
  formatTelegramFileMetadata,
};
