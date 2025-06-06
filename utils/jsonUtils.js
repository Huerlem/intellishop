/**
 * Tenta extrair JSON válido de uma string que pode conter texto antes ou depois.
 * Funciona para objetos `{}` e arrays `[]`.
 * @param {string} text - Texto da resposta da IA
 * @returns {Object|Array|null}
 */
export const extractJSON = (text) => {
    try {
      let startIndex = text.indexOf('{');
      let endIndex = text.lastIndexOf('}') + 1;
  
      if (startIndex === -1 || endIndex === 0) {
        startIndex = text.indexOf('[');
        endIndex = text.lastIndexOf(']') + 1;
      }
  
      if (startIndex === -1 || endIndex === 0) {
        return null;
      }
  
      const jsonString = text.substring(startIndex, endIndex);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('❌ Erro ao extrair JSON:', error);
      return null;
    }
  };