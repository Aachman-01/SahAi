// Minimal Cloudinary Image API adapter using Node's built-in fetch/FormData.
// No npm dependency is required. Credentials must only exist on the backend.

const crypto = require('crypto');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
const folder = process.env.CLOUDINARY_FOLDER || 'sahai';

function isConfigured() {
  return Boolean(cloudName && apiKey && apiSecret);
}

function sign(params) {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(serialized + apiSecret).digest('hex');
}

function endpoint(action) {
  const base = 'https:' + '//api.cloudinary.com/v1_1/';
  return base + encodeURIComponent(cloudName) + '/image/' + action;
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload && payload.error && payload.error.message;
    throw new Error(detail || `Cloudinary request failed (${response.status})`);
  }
  return payload;
}

async function uploadImage({ buffer, mime, publicId }) {
  if (!isConfigured()) throw new Error('Cloudinary is not configured');
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, public_id: publicId, timestamp };
  const form = new FormData();
  form.set('file', new Blob([buffer], { type: mime }), publicId);
  form.set('api_key', apiKey);
  form.set('timestamp', String(timestamp));
  form.set('folder', folder);
  form.set('public_id', publicId);
  form.set('signature', sign(params));

  const payload = await parseResponse(await fetch(endpoint('upload'), {
    method: 'POST',
    body: form,
  }));

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    width: payload.width,
    height: payload.height,
    bytes: payload.bytes,
    format: payload.format,
  };
}

async function deleteImage(publicId) {
  if (!isConfigured() || !publicId) return false;
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  const form = new FormData();
  form.set('public_id', publicId);
  form.set('api_key', apiKey);
  form.set('timestamp', String(timestamp));
  form.set('signature', sign(params));

  const payload = await parseResponse(await fetch(endpoint('destroy'), {
    method: 'POST',
    body: form,
  }));
  return payload.result === 'ok' || payload.result === 'not found';
}

module.exports = { isConfigured, uploadImage, deleteImage };
