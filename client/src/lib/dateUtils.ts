import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Função utilitária para formatação segura de datas
 * Resolve problemas de timezone convertendo qualquer data para string local
 */
export const formatDateSafe = (dateInput: string | Date, formatString: string = "dd/MM/yyyy"): string => {
  try {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      // Se a string contém apenas data (YYYY-MM-DD), adiciona horário meio-dia para evitar problemas de timezone
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateInput + 'T12:00:00');
      } 
      // Se a string contém timestamp completo, converte para data local
      else if (dateInput.includes('T')) {
        date = parseISO(dateInput);
        // Ajusta para timezone local
        date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      }
      // Outros formatos
      else {
        date = new Date(dateInput + 'T12:00:00');
      }
    } else {
      date = dateInput;
    }
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return dateInput.toString();
    }
    
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    console.warn('Erro ao formatar data:', error, 'Input:', dateInput);
    return dateInput.toString();
  }
};

/**
 * Formata data para exibição completa (ex: "sexta-feira, 27 de julho de 2025")
 */
export const formatEventDateSafe = (dateInput: string | Date): string => {
  return formatDateSafe(dateInput, "EEEE, dd 'de' MMMM 'de' yyyy");
};

/**
 * Formata data simples (ex: "27/07/2025")
 */
export const formatDateSimpleSafe = (dateInput: string | Date): string => {
  return formatDateSafe(dateInput, "dd/MM/yyyy");
};

/**
 * Formata data para input HTML (YYYY-MM-DD)
 */
export const formatDateForInput = (dateInput: string | Date): string => {
  try {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateInput; // Já está no formato correto
      }
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return format(date, "yyyy-MM-dd");
  } catch (error) {
    console.warn('Erro ao formatar data para input:', error);
    return '';
  }
};