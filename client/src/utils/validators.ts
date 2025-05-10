import { z } from 'zod';

/**
 * Common validation schemas for forms
 */

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, { message: "Email é obrigatório" })
  .email({ message: "Email inválido" });

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(6, { message: "Senha deve ter pelo menos 6 caracteres" })
  .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
  .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" });

/**
 * Password confirmation validation schema
 * @param fieldName - Name of the password field to match against
 */
export const confirmPasswordSchema = (fieldName: string) =>
  z.string().refine(
    (data, ctx) => data === ctx.parent[fieldName],
    {
      message: "As senhas não conferem",
    }
  );

/**
 * CPF validation schema
 */
export const cpfSchema = z
  .string()
  .min(1, { message: "CPF é obrigatório" })
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { 
    message: "CPF inválido. Utilize o formato: 000.000.000-00" 
  });

/**
 * CEP (Postal code) validation schema
 */
export const cepSchema = z
  .string()
  .min(1, { message: "CEP é obrigatório" })
  .regex(/^\d{5}-\d{3}$/, { 
    message: "CEP inválido. Utilize o formato: 00000-000" 
  });

/**
 * Phone validation schema
 */
export const phoneSchema = z
  .string()
  .min(1, { message: "Telefone é obrigatório" })
  .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, {
    message: "Telefone inválido. Utilize o formato: (00) 00000-0000"
  });

/**
 * Date validation schema
 */
export const dateSchema = z
  .string()
  .min(1, { message: "Data é obrigatória" })
  .refine((val) => !isNaN(Date.parse(val)), { 
    message: "Data inválida" 
  });

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
  .regex(/^[a-zA-ZÀ-ÖØ-öø-ÿ\s]+$/, {
    message: "Nome deve conter apenas letras"
  });

/**
 * Validate if a CPF is valid (with proper algorithm)
 * @param cpf - CPF string to validate
 * @returns Whether CPF is valid or not
 */
export function isValidCPF(cpf: string): boolean {
  // Remove any non-digit character
  const cleanCpf = cpf.replace(/\D/g, "");
  
  if (cleanCpf.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCpf)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  
  let checkDigit1 = 11 - (sum % 11);
  if (checkDigit1 === 10 || checkDigit1 === 11) {
    checkDigit1 = 0;
  }
  
  if (checkDigit1 !== parseInt(cleanCpf.charAt(9))) {
    return false;
  }
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  
  let checkDigit2 = 11 - (sum % 11);
  if (checkDigit2 === 10 || checkDigit2 === 11) {
    checkDigit2 = 0;
  }
  
  return checkDigit2 === parseInt(cleanCpf.charAt(10));
}

/**
 * Validate date range
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Whether the date range is valid
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return end > start;
  } catch (error) {
    return false;
  }
}

/**
 * Create a validation function for file size
 * @param maxSizeInMB - Maximum file size allowed in MB
 * @returns Validation function for files
 */
export function validateFileSize(maxSizeInMB: number) {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  return (file: File) => {
    return file.size <= maxSizeInBytes || `O arquivo deve ter no máximo ${maxSizeInMB}MB`;
  };
}

/**
 * Create a validation function for file type
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation function for files
 */
export function validateFileType(allowedTypes: string[]) {
  return (file: File) => {
    return allowedTypes.includes(file.type) || `Tipo de arquivo não suportado. Tipos permitidos: ${allowedTypes.join(", ")}`;
  };
}
