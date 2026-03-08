/**
 * Google Apps Script for Fleet Management App
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Create sheets named: "Vehicles", "Maintenances", "Agenda", "Intervals", "Mechanics", "Users".
 * 3. Add headers to each sheet (Row 1):
 *    - Vehicles: id, number, type, plate, km_current, status, last_maintenance_km, is_contracted, contract_company, contract_closing_day, contract_value
 *    - Maintenances: id, vehicle_id, date, start_time, end_time, type, km, mechanic, services, other_services, observations, cost
 *    - Agenda: id, day_of_week, vehicle_id, status
 *    - Intervals: id, service_type, interval_km
 *    - Mechanics: id, name
 *    - Users: id, email, password, role, name
 * 4. Go to Extensions > Apps Script.
 * 5. Paste this code and click Deploy > New Deployment.
 * 6. Select "Web App", Execute as "Me", Access "Anyone".
 * 7. Copy the Web App URL and set it as GOOGLE_SHEETS_SCRIPT_URL in your app's environment variables.
 */

function doGet(e) {
  try {
    var action = e.parameter.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Support both 'getData' (server.ts) and 'read' (alternative)
    if (action === 'getData' || action === 'read') {
      var sheetName = e.parameter.sheet;
      var sheet = getSheetCaseInsensitive(ss, sheetName);
      if (!sheet) return errorResponse("Planilha não encontrada: " + sheetName);
      
      var range = sheet.getDataRange();
      var data = range.getValues();
      
      // Check if sheet is actually empty (only one empty cell)
      if (data.length === 0 || (data.length === 1 && data[0].length === 1 && data[0][0] === "")) {
        return jsonResponse([]);
      }
      
      var headers = data.shift().map(function(h) { 
        return h ? h.toString().toLowerCase().trim() : ""; 
      });
      
      var result = data.map(function(row) {
        var obj = {};
        headers.forEach(function(header, i) {
          if (!header) return;
          obj[header] = formatValue(row[i]);
        });
        return obj;
      });
      
      if (e.parameter.id) {
        var id = e.parameter.id;
        var item = result.find(function(r) { return String(r.id) === String(id); });
        return jsonResponse(item || {error: "Item não encontrado"});
      }
      
      return jsonResponse(result);
    }
    
    return errorResponse("Ação inválida no doGet: " + action + ". Use 'getData'.");
  } catch (err) {
    return errorResponse("Erro interno no doGet: " + err.toString());
  }
}

function doPost(e) {
  try {
    var params;
    try {
      params = JSON.parse(e.postData.contents);
    } catch (err) {
      return errorResponse("Falha ao processar dados (JSON inválido): " + e.postData.contents);
    }
    
    var action = params.action || e.parameter.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = params.sheet || e.parameter.sheet;
    var sheet = getSheetCaseInsensitive(ss, sheetName);
    
    if (!sheet) return errorResponse("Planilha não encontrada: " + sheetName);
    
    // Support both 'insert' (server.ts) and 'create' (alternative)
    if (action === 'insert' || action === 'create') {
      var lastCol = sheet.getLastColumn();
      if (lastCol === 0) return errorResponse("A planilha '" + sheetName + "' está vazia. Adicione cabeçalhos.");
      
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return h.toString().toLowerCase().trim(); });
      var data = params.data || params.payload;
      
      if (!data) return errorResponse("Dados não fornecidos.");
      
      if (!data.id) {
        data.id = new Date().getTime();
      }
      
      var newRow = headers.map(function(header) {
        var val = data[header];
        return safeStringify(val);
      });
      sheet.appendRow(newRow);
      return jsonResponse({success: true, id: String(data.id)});
    }
    
    if (action === 'update') {
      var id = params.id;
      var data = params.data || params.payload;
      var rows = sheet.getDataRange().getValues();
      var headers = rows.shift().map(function(h) { return h.toString().toLowerCase().trim(); });
      var idIndex = headers.indexOf('id');
      
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][idIndex]) === String(id)) {
          var rowNum = i + 2;
          headers.forEach(function(header, j) {
            if (data[header] !== undefined && data[header] !== null) {
              sheet.getRange(rowNum, j + 1).setValue(safeStringify(data[header]));
            }
          });
          return jsonResponse({success: true, id: String(id)});
        }
      }
      return errorResponse("Registro não encontrado com ID: " + id);
    }
    
    if (action === 'delete') {
      var id = params.id;
      var rows = sheet.getDataRange().getValues();
      var headers = rows.shift().map(function(h) { return h.toString().toLowerCase().trim(); });
      var idIndex = headers.indexOf('id');
      
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][idIndex]) === String(id)) {
          sheet.deleteRow(i + 2);
          return jsonResponse({success: true, id: String(id)});
        }
      }
      return errorResponse("Registro não encontrado com ID: " + id);
    }
    
    return errorResponse("Ação inválida no doPost: " + action + ". Verifique se o script foi atualizado.");
  } catch (err) {
    return errorResponse("Erro interno no doPost: " + err.toString());
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({error: msg}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetCaseInsensitive(ss, name) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toLowerCase() === name.toLowerCase()) {
      return sheets[i];
    }
  }
  return null;
}

function safeStringify(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch (e) {
      return "[]";
    }
  }
  return String(val);
}

function formatValue(val) {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch (e) {
      return "[]";
    }
  }
  
  var str = String(val);
  // Check for corrupted object strings
  if (str.indexOf("[object Object]") !== -1 || str.indexOf("[Ljava.lang.Object") !== -1) {
    return "[]";
  }
  
  return str;
}
