/**
 * FrotaControl - Google Sheets Backend Script
 * 
 * Instruções:
 * 1. Abra uma nova Planilha Google.
 * 2. Vá em Extensões > App Script.
 * 3. Cole este código no editor.
 * 4. Crie as abas (sheets) com os nomes: vehicles, maintenances, agenda, intervals, mechanics.
 * 5. Clique em "Implantar" > "Nova implantação".
 * 6. Selecione "App da Web".
 * 7. Em "Quem pode acessar", selecione "Qualquer pessoa" (ou "Qualquer pessoa com conta Google").
 * 8. Copie a URL gerada e coloque no seu arquivo .env como GOOGLE_SHEETS_URL.
 */

const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  const action = e.parameter.action;
  const sheetName = e.parameter.sheet;
  
  try {
    if (action === 'read') {
      return jsonResponse(readSheet(sheetName, e.parameter.id));
    }
    if (action === 'query') {
      return jsonResponse(querySheet(sheetName, e.parameter.key, e.parameter.value));
    }
    return jsonResponse({ error: 'Ação inválida' }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheetName = data.sheet;
    
    if (action === 'create') {
      return jsonResponse(createRow(sheetName, data.payload));
    }
    if (action === 'update') {
      return jsonResponse(updateRow(sheetName, data.id, data.payload));
    }
    if (action === 'delete') {
      return jsonResponse(deleteRow(sheetName, data.id));
    }
    return jsonResponse({ error: 'Ação inválida' }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const sheet = SPREADSHEET.getSheetByName(name);
  if (!sheet) throw new Error(`Planilha "${name}" não encontrada.`);
  return sheet;
}

function readSheet(name, id) {
  const sheet = getSheet(name);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
  
  if (id) {
    return result.find(r => String(r.id) === String(id));
  }
  return result;
}

function querySheet(name, key, value) {
  const data = readSheet(name);
  return data.filter(r => String(r[key]) === String(value));
}

function createRow(name, payload) {
  const sheet = getSheet(name);
  const headers = sheet.getDataRange().getValues()[0];
  
  // Generate ID if not provided
  if (!payload.id) {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      payload.id = 1;
    } else {
      const lastId = sheet.getRange(lastRow, 1).getValue();
      payload.id = Number(lastId) + 1;
    }
  }
  
  const row = headers.map(header => payload[header] || "");
  sheet.appendRow(row);
  return payload;
}

function updateRow(name, id, payload) {
  const sheet = getSheet(name);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const range = sheet.getRange(i + 1, 1, 1, headers.length);
      const newRow = headers.map((header, index) => {
        return payload.hasOwnProperty(header) ? payload[header] : data[i][index];
      });
      range.setValues([newRow]);
      return { id, ...payload };
    }
  }
  throw new Error(`ID ${id} não encontrado na planilha ${name}.`);
}

function deleteRow(name, id) {
  const sheet = getSheet(name);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, id };
    }
  }
  throw new Error(`ID ${id} não encontrado na planilha ${name}.`);
}
