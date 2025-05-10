/**
 * Format a date string to a localized date format
 * @param dateString - ISO date string to format
 * @param options - Intl.DateTimeFormatOptions to customize the format
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string, 
  options: Intl.DateTimeFormatOptions = { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  }
): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

/**
 * Format a date with time
 * @param dateString - ISO date string to format
 * @param timeString - Time string in format "HH:MM"
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string, timeString?: string): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("pt-BR");
    
    if (timeString) {
      return `${formattedDate} - ${timeString}`;
    }
    
    return formattedDate;
  } catch (error) {
    console.error("Error formatting date time:", error);
    return dateString;
  }
}

/**
 * Format a number to currency (BRL)
 * @param value - Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format a CPF string with proper mask (000.000.000-00)
 * @param cpf - CPF string to format
 * @returns Formatted CPF string
 */
export function formatCPF(cpf: string): string {
  if (!cpf) return "";
  
  // Remove any non-digit character
  const digits = cpf.replace(/\D/g, "");
  
  // Apply the mask
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Format a CEP (postal code) string with proper mask (00000-000)
 * @param cep - CEP string to format
 * @returns Formatted CEP string
 */
export function formatCEP(cep: string): string {
  if (!cep) return "";
  
  // Remove any non-digit character
  const digits = cep.replace(/\D/g, "");
  
  // Apply the mask
  return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

/**
 * Format a phone number with proper mask ((00) 00000-0000)
 * @param phone - Phone string to format
 * @returns Formatted phone string
 */
export function formatPhone(phone: string): string {
  if (!phone) return "";
  
  // Remove any non-digit character
  const digits = phone.replace(/\D/g, "");
  
  // Check if it's a cell phone (with 9 digits) or landline (with 8 digits)
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

/**
 * Truncate text to a specific length and add ellipsis if needed
 * @param text - Text to truncate
 * @param maxLength - Maximum length allowed
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + "...";
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
