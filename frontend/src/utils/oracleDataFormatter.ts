/**
 * Oracle Data Format Utility
 * Ensures compatibility between frontend and Oracle database
 * Handles data type conversions and formatting
 */

/**
 * ✅ ORACLE FIX: Convert JavaScript Date to Oracle-compatible format
 * Oracle prefers: YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM:SS.SSS
 */
export const toOracleTimestamp = (date: Date = new Date()): string => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

/**
 * ✅ ORACLE FIX: Convert boolean to Oracle numeric format (1/0)
 * Oracle stores booleans as NUMBER(1) with values 1 (true) or 0 (false)
 */
export const toOracleBoolean = (value: boolean | string | number): string => {
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' ? '1' : '0';
  }
  return value === 1 ? '1' : '0';
};

/**
 * ✅ ORACLE FIX: Format UUID for Oracle
 * Oracle UUID format: UUID should be stored as VARCHAR2(36) with standard format
 * Validates UUID format and ensures consistency
 */
export const formatUUIDForOracle = (uuid: string): string => {
  if (!uuid) {
    throw new Error('UUID is required');
  }

  // Remove any extra whitespace
  const trimmedUUID = uuid.trim();

  // Validate UUID format (with or without hyphens)
  const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

  if (!uuidRegex.test(trimmedUUID)) {
    console.warn(`Invalid UUID format: ${trimmedUUID}`);
    return trimmedUUID; // Return as-is for debugging
  }

  // Ensure standard format with hyphens
  if (trimmedUUID.length === 32) {
    // No hyphens, add them
    return `${trimmedUUID.substring(0, 8)}-${trimmedUUID.substring(8, 12)}-${trimmedUUID.substring(12, 16)}-${trimmedUUID.substring(
      16,
      20
    )}-${trimmedUUID.substring(20)}`;
  }

  return trimmedUUID;
};

/**
 * ✅ ORACLE FIX: Format decimal numbers for Oracle
 * Ensures proper decimal precision for latitude/longitude
 */
export const formatDecimalForOracle = (value: number, decimals: number = 8): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  return value.toFixed(decimals);
};

/**
 * ✅ ORACLE FIX: Format FormData for Oracle compatibility
 * Handles all conversions in one place
 */
export const formatAttendanceDataForOracle = (data: {
  action: string;
  timestamp?: Date | string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  locationType?: string;
  isInOffice?: boolean | string | number;
  deviceType?: string;
  [key: string]: any;
}): FormData => {
  const formData = new FormData();

  // Required fields
  if (data.action) {
    formData.append('action', data.action);
  }

  // Timestamp conversion
  if (data.timestamp) {
    const timestamp =
      data.timestamp instanceof Date
        ? toOracleTimestamp(data.timestamp)
        : typeof data.timestamp === 'string'
        ? data.timestamp
        : toOracleTimestamp();
    formData.append('timestamp', timestamp);
  } else {
    formData.append('timestamp', toOracleTimestamp());
  }

  // Location data with proper formatting
  if (data.latitude !== undefined && data.latitude !== null) {
    formData.append('latitude', formatDecimalForOracle(data.latitude));
  }

  if (data.longitude !== undefined && data.longitude !== null) {
    formData.append('longitude', formatDecimalForOracle(data.longitude));
  }

  if (data.accuracy !== undefined && data.accuracy !== null) {
    formData.append('accuracy', String(data.accuracy));
  }

  // Boolean conversion
  if (data.isInOffice !== undefined && data.isInOffice !== null) {
    formData.append('isInOffice', toOracleBoolean(data.isInOffice));
  }

  // String fields
  if (data.locationType) {
    formData.append('locationType', data.locationType);
  }

  if (data.deviceType) {
    formData.append('deviceType', data.deviceType);
  }

  // Add any remaining fields
  Object.entries(data).forEach(([key, value]) => {
    if (
      !['action', 'timestamp', 'latitude', 'longitude', 'accuracy', 'locationType', 'isInOffice', 'deviceType'].includes(key) &&
      value !== undefined &&
      value !== null
    ) {
      formData.append(key, String(value));
    }
  });

  return formData;
};

/**
 * ✅ ORACLE FIX: Validate payload for Oracle compatibility
 * Checks data types and formats before sending to backend
 */
export const validateOraclePayload = (payload: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check UUID if present
  if (payload.uuid) {
    try {
      formatUUIDForOracle(payload.uuid);
    } catch (error) {
      errors.push(`Invalid UUID: ${error}`);
    }
  }

  // Check coordinates if present
  if (payload.latitude !== undefined && (typeof payload.latitude !== 'number' || isNaN(payload.latitude))) {
    errors.push('Latitude must be a valid number');
  }

  if (payload.longitude !== undefined && (typeof payload.longitude !== 'number' || isNaN(payload.longitude))) {
    errors.push('Longitude must be a valid number');
  }

  // Check timestamp format if present
  if (payload.timestamp && !(payload.timestamp instanceof Date) && typeof payload.timestamp !== 'string') {
    errors.push('Timestamp must be a Date object or ISO string');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  toOracleTimestamp,
  toOracleBoolean,
  formatUUIDForOracle,
  formatDecimalForOracle,
  formatAttendanceDataForOracle,
  validateOraclePayload
};
