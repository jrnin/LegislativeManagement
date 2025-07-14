import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Obtém as iniciais de um nome completo (ex: "João Silva" -> "JS")
 */
export function getInitials(name: string): string {
  if (!name) return "";
  
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase();
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
    // Usar a mesma lógica da formatDate para evitar problemas de fuso horário
    let date: Date;
    
    if (dateString.includes('T') || dateString.includes(' ')) {
      // Se tem horário, extrair apenas a parte da data
      const datePart = dateString.split('T')[0].split(' ')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day); // mês é zero-indexado
    } else {
      // Se é apenas data (YYYY-MM-DD)
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day); // mês é zero-indexado
    }
    
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
 * Format a date string to Brazilian format
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  
  try {
    let date: Date;
    
    if (dateString.includes('T') || dateString.includes(' ')) {
      // Se tem horário, extrair apenas a parte da data
      const datePart = dateString.split('T')[0].split(' ')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      date = new Date(year, month - 1, day); // mês é zero-indexado
    } else {
      // Se é apenas data (YYYY-MM-DD)
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day); // mês é zero-indexado
    }
    
    return date.toLocaleDateString("pt-BR");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}
