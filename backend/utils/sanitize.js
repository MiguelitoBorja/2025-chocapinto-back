/**
 * Utilidades para sanitizar datos en el backend y prevenir ataques XSS
 */

/**
 * Remueve caracteres HTML peligrosos de una cadena
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizeHtml(text) {
  if (text === null || text === undefined) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza un objeto completo recursivamente
 * @param {object} obj - Objeto a sanitizar
 * @param {string[]} fieldsToSanitize - Campos específicos a sanitizar
 * @returns {object} Objeto con campos sanitizados
 */
function sanitizeObject(obj, fieldsToSanitize = ['name', 'description', 'content', 'title', 'username']) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (fieldsToSanitize.includes(key) && typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, fieldsToSanitize);
    }
  }
  
  return sanitized;
}

/**
 * Valida que una cadena no contenga scripts o HTML peligroso
 * @param {string} text - Texto a validar
 * @returns {boolean} true si es seguro, false si contiene contenido peligroso
 */
function isContentSafe(text) {
  if (!text || typeof text !== 'string') return true;
  
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<img[^>]+onerror/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(text));
}

/**
 * Middleware para sanitizar el body de requests
 * @param {string[]} fields - Campos específicos a sanitizar (opcional)
 */
function sanitizeMiddleware(fields) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, fields);
    }
    next();
  };
}

module.exports = {
  sanitizeHtml,
  sanitizeObject,
  isContentSafe,
  sanitizeMiddleware
};
