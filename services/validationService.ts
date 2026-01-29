/**
 * Input Validation Utilities
 * Lightweight validation without external dependencies (Zod-like interface)
 * For production, consider using Zod or Yup
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  data?: any;
}

// Validator builder
export const validator = {
  string: () => new StringValidator(),
  number: () => new NumberValidator(),
  email: () => new StringValidator().email(),
  phone: () => new StringValidator().phone(),
  uuid: () => new StringValidator().uuid(),
};

class StringValidator {
  private rules: Array<(value: any) => string | null> = [];
  private isOptional = false;

  required(message = 'Field is required') {
    this.rules.push((value) => {
      if (value === undefined || value === null || value === '') {
        return message;
      }
      return null;
    });
    return this;
  }

  optional() {
    this.isOptional = true;
    return this;
  }

  min(length: number, message?: string) {
    this.rules.push((value) => {
      if (this.isOptional && !value) return null;
      if (typeof value === 'string' && value.length < length) {
        return message || `Must be at least ${length} characters`;
      }
      return null;
    });
    return this;
  }

  max(length: number, message?: string) {
    this.rules.push((value) => {
      if (this.isOptional && !value) return null;
      if (typeof value === 'string' && value.length > length) {
        return message || `Must be at most ${length} characters`;
      }
      return null;
    });
    return this;
  }

  email(message = 'Invalid email format') {
    this.rules.push((value) => {
      if (this.isOptional && !value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return message;
      }
      return null;
    });
    return this;
  }

  phone(message = 'Invalid phone format') {
    this.rules.push((value) => {
      if (this.isOptional && !value) return null;
      // Indonesian phone format or international
      const phoneRegex = /^(\+62|62|0)?[0-9]{9,13}$/;
      if (!phoneRegex.test(value?.replace(/[\s-]/g, ''))) {
        return message;
      }
      return null;
    });
    return this;
  }

  uuid(message = 'Invalid UUID format') {
    this.rules.push((value) => {
      if (this.isOptional && !value) return null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        return message;
      }
      return null;
    });
    return this;
  }

  licensePlate(message = 'Invalid license plate format') {
    this.rules.push((value) => {
      if (this.isOptional && !value) return null;
      // Indonesian plate format: XX 1234 XXX
      const plateRegex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/i;
      if (!plateRegex.test(value?.replace(/\s+/g, ' ').trim())) {
        return message;
      }
      return null;
    });
    return this;
  }

  pattern(regex: RegExp, message = 'Invalid format') {
    this.rules.push((value) => {
      if (this.isOptional && !value) return null;
      if (!regex.test(value)) {
        return message;
      }
      return null;
    });
    return this;
  }

  validate(value: any): string | null {
    for (const rule of this.rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  }
}

class NumberValidator {
  private rules: Array<(value: any) => string | null> = [];
  private isOptional = false;

  required(message = 'Field is required') {
    this.rules.push((value) => {
      if (value === undefined || value === null || value === '') {
        return message;
      }
      return null;
    });
    return this;
  }

  optional() {
    this.isOptional = true;
    return this;
  }

  min(minValue: number, message?: string) {
    this.rules.push((value) => {
      if (this.isOptional && (value === undefined || value === null)) return null;
      const num = Number(value);
      if (isNaN(num) || num < minValue) {
        return message || `Must be at least ${minValue}`;
      }
      return null;
    });
    return this;
  }

  max(maxValue: number, message?: string) {
    this.rules.push((value) => {
      if (this.isOptional && (value === undefined || value === null)) return null;
      const num = Number(value);
      if (isNaN(num) || num > maxValue) {
        return message || `Must be at most ${maxValue}`;
      }
      return null;
    });
    return this;
  }

  positive(message = 'Must be a positive number') {
    this.rules.push((value) => {
      if (this.isOptional && (value === undefined || value === null)) return null;
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return message;
      }
      return null;
    });
    return this;
  }

  integer(message = 'Must be a whole number') {
    this.rules.push((value) => {
      if (this.isOptional && (value === undefined || value === null)) return null;
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num)) {
        return message;
      }
      return null;
    });
    return this;
  }

  validate(value: any): string | null {
    for (const rule of this.rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  }
}

// Schema-based validation
export function validateSchema<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, StringValidator | NumberValidator>
): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const [field, validator] of Object.entries(schema)) {
    const value = data[field as keyof T];
    const error = (validator as StringValidator | NumberValidator).validate(value);
    if (error) {
      errors.push({ field, message: error });
    }
  }

  return {
    success: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : undefined
  };
}

// Pre-built schemas for common entities
export const schemas = {
  // Staff/User validation
  staff: {
    name: validator.string().required('Nama wajib diisi').min(2, 'Nama minimal 2 karakter'),
    username: validator.string().required('Username wajib diisi').min(3, 'Username minimal 3 karakter'),
    password: validator.string().required('Password wajib diisi').min(6, 'Password minimal 6 karakter'),
    role: validator.string().required('Role wajib dipilih'),
    email: validator.email().optional(),
    phone: validator.phone().optional(),
  },

  // Service record validation
  serviceRecord: {
    licensePlate: validator.string().required('Plat nomor wajib diisi').licensePlate(),
    customerName: validator.string().required('Nama pelanggan wajib diisi').min(2),
    phone: validator.phone().optional(),
    vehicleModel: validator.string().required('Model kendaraan wajib diisi'),
    complaint: validator.string().required('Keluhan wajib diisi').min(5, 'Deskripsi keluhan terlalu singkat'),
  },

  // Booking validation
  booking: {
    customerName: validator.string().required('Nama wajib diisi').min(2),
    phone: validator.phone().required('Nomor telepon wajib diisi'),
    licensePlate: validator.string().required('Plat nomor wajib diisi'),
    vehicleModel: validator.string().required('Model kendaraan wajib diisi'),
    bookingDate: validator.string().required('Tanggal booking wajib diisi'),
    bookingTime: validator.string().required('Jam booking wajib diisi'),
    complaint: validator.string().required('Keluhan wajib diisi'),
  }
};

// Helper function for easy validation
export function validate(data: Record<string, any>, schemaName: keyof typeof schemas): ValidationResult {
  const schema = schemas[schemaName] as Record<string, StringValidator | NumberValidator>;
  return validateSchema(data, schema);
}

// Display validation errors as alert or return formatted message
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(e => `• ${e.message}`).join('\n');
}
