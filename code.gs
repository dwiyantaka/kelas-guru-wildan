// Google Apps Script Backend for Teacher Administration Dashboard
// Following CORS bypass rules: No custom headers needed

// Spreadsheet ID - REPLACE WITH YOUR SPREADSHEET ID
const SPREADSHEET_ID = 'SPREADSHEET_ID';

// Global variables
var SS;

// Initialize sheets when the web app loads
function doGet(e) {
  // Initialize the spreadsheet
  SS = SpreadsheetApp.openById(SPREADSHEET_ID);
  return handleRequest(e);
}

function doPost(e) {
  // Initialize the spreadsheet
  SS = SpreadsheetApp.openById(SPREADSHEET_ID);
  return handleRequest(e);
}

// Function to test initialization - can be run directly from the script editor
function testInitialization() {
  SS = SpreadsheetApp.openById(SPREADSHEET_ID);
  initializeSheets();
  return "Sheets initialized successfully!";
}

function handleRequest(e) {
  // Ensure the spreadsheet is initialized
  if (!SS) {
    SS = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  
  // Initialize sheets if they don't exist
  initializeSheets();
  
  // Process the request parameters - langsung dari e.parameter sesuai rules CORS.txt
  var params = e && e.parameter ? e.parameter : {};
  var action = params.action;
  
  // Debug logging - with safety checks
  Logger.log('Received request with parameters:');
  Logger.log('e:', e ? 'defined' : 'undefined');
  Logger.log('e.parameter:', e && e.parameter ? JSON.stringify(e.parameter) : 'undefined');
  Logger.log('action:', action || 'undefined');
  Logger.log('params:', JSON.stringify(params));
  
  // If no action provided, return a default response for direct browser access
  if (!action) {
    return createCORSResponse(JSON.stringify({
      success: true,
      message: "Teacher Administration API is running. Please use POST requests with an action parameter."
    }));
  }
  
  var result = { success: false, error: "Invalid action" };
  
  // Route to the appropriate function based on action
  try {
    Logger.log('Processing action:', action);
    switch(action) {
      // Debug actions
      case 'debugSiswaData':
        Logger.log('Executing debugSiswaData');
        result = debugSiswaData();
        break;
        
      // Special action to check/fix admin user
      case 'checkAdminUser':
        Logger.log('Executing checkAdminUser');
        result = checkAdminUser();
        break;
        
      // User actions
      case 'login':
        Logger.log('Executing login');
        result = login(params);
        break;
      case 'createUser':
        result = createUser(params);
        break;
      case 'updateUser':
        result = updateUser(params);
        break;
      case 'deleteUser':
        result = deleteUser(params);
        break;
      case 'getUsers':
        result = getUsers(params);
        break;
        
      // Kelas (Class) actions
      case 'getKelas':
        if (params.paginated === 'true') {
          result = getKelasPaginated(params);
        } else {
          result = getKelas(params);
        }
        break;
      case 'createKelas':
        result = createKelas(params);
        break;
      case 'updateKelas':
        result = updateKelas(params);
        break;
      case 'deleteKelas':
        result = deleteKelas(params);
        break;
        
      // Siswa (Student) actions
      case 'getSiswa':
        if (params.paginated === 'true') {
          result = getSiswaPaginated(params);
        } else {
          result = getSiswa(params);
        }
        break;
      case 'createSiswa':
        result = createSiswa(params);
        break;
      case 'updateSiswa':
        result = updateSiswa(params);
        break;
      case 'deleteSiswa':
        result = deleteSiswa(params);
        break;
        
      // Tugas (Assignment) actions
      case 'getTugas':
        if (params.paginated === 'true') {
          result = getTugasPaginated(params);
        } else {
          result = getTugas(params);
        }
        break;
      case 'createTugas':
        result = createTugas(params);
        break;
      case 'updateTugas':
        result = updateTugas(params);
        break;
      case 'deleteTugas':
        result = deleteTugas(params);
        break;
        
      // Nilai (Grade) actions
      case 'getNilai':
        if (params.paginated === 'true') {
          result = getNilaiPaginated(params);
        } else {
          result = getNilai(params);
        }
        break;
      case 'createNilai':
        result = createNilai(params);
        break;
      case 'updateNilai':
        result = updateNilai(params);
        break;
      case 'deleteNilai':
        result = deleteNilai(params);
        break;
        
      default:
        result = { success: false, error: `Invalid action: ${action}` };
    }
  } catch (error) {
    Logger.log('Error processing request:', error);
    result = { success: false, error: error.toString() };
  }
  
  // Return CORS-compatible response
  return createCORSResponse(JSON.stringify(result));
}

/**
 * Initializes all required sheets with proper headers if they don't exist
 */
function initializeSheets() {
  var sheets = {
    // User sheet for authentication
    'User': ['id', 'username', 'password', 'name', 'role', 'email', 'created_at', 'updated_at'],
    
    'Kelas': ['id', 'nama_kelas', 'tingkat', 'tahun_ajaran', 'wali_kelas', 'mata_pelajaran', 'created_at', 'updated_at'],
    
    'Siswa': ['id', 'kelas_id', 'nama', 'nis', 'jenis_kelamin', 'tanggal_lahir', 'alamat', 'nama_orang_tua', 'no_telp', 'created_at', 'updated_at'],
    
    'Tugas': ['id', 'kelas_id', 'judul', 'deskripsi', 'jenis', 'tanggal_mulai', 'tanggal_selesai', 'bobot', 'status', 'created_at', 'updated_at'],
    
    'Nilai': ['id', 'siswa_id', 'tugas_id', 'nilai', 'komentar', 'tanggal_penilaian', 'created_at', 'updated_at']
  };
  
  // Create each sheet if it doesn't exist
  for (var sheetName in sheets) {
    var sheet = SS.getSheetByName(sheetName);
    
    // If sheet doesn't exist, create it with headers
    if (!sheet) {
      sheet = SS.insertSheet(sheetName);
      
      // Set the headers in the first row
      var headers = sheets[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format the header row
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
      
      // Add default admin user if this is the User sheet
      if (sheetName === 'User') {
        var adminUser = [
          generateUniqueId(),    // id
          'admin',               // username
          'admin123',            // password (in a real app, this should be hashed)
          'Administrator',       // name
          'admin',               // role
          'admin@example.com',   // email
          getCurrentTimestamp(), // created_at
          getCurrentTimestamp()  // updated_at
        ];
        sheet.appendRow(adminUser);
      }
    }
  }
}

// Helper Functions for CRUD Operations

/**
 * Generates a unique ID
 */
function generateUniqueId() {
  return Utilities.getUuid();
}

/**
 * Gets the current timestamp
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Gets all data from a sheet as an array of objects
 */
function getAllData(sheetName) {
  var sheet = SS.getSheetByName(sheetName);
  if (!sheet) {
    return [];
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  
  return data.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Finds a record by ID in a specific sheet
 */
function findRecordById(sheetName, id) {
  var sheet = SS.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("Sheet not found: " + sheetName);
    return null;
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  
  // Convert id to string for comparison
  var idStr = String(id);
  
  Logger.log("Searching for ID: " + idStr + " in sheet: " + sheetName);
  Logger.log("Headers: " + JSON.stringify(headers));
  Logger.log("First row data: " + JSON.stringify(data[0] || []));
  Logger.log("Total rows: " + data.length);
  
  for (var i = 0; i < data.length; i++) {
    var rowId = data[i][0];
    var rowIdStr = String(rowId);
    Logger.log("Row " + i + " ID: " + rowIdStr + " (type: " + typeof rowId + "), comparing with: " + idStr);
    // Convert cell value to string for comparison
    if (rowIdStr === idStr) {
      Logger.log("Match found at row: " + (i + 2));
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = data[i][index];
      });
      return { data: obj, rowIndex: i + 2 }; // +2 because we shifted headers and rows are 1-indexed
    }
  }
  
  Logger.log("No match found for ID: " + idStr + " in sheet: " + sheetName);
  return null;
}

/**
 * Finds a user by username
 */
function findUserByUsername(username) {
  var sheet = SS.getSheetByName('User');
  if (!sheet) {
    Logger.log('User sheet not found');
    return null;
  }
  
  var data = sheet.getDataRange().getValues();
  
  Logger.log('User sheet data rows count: ' + data.length);
  if (data.length <= 1) {
    Logger.log('User sheet is empty or has only headers');
    return null;
  }
  
  var headers = data.shift();
  
  // Find username index
  var usernameIndex = headers.indexOf('username');
  if (usernameIndex === -1) {
    Logger.log('Username column not found in User sheet');
    return null;
  }
  
  Logger.log('Looking for username: ' + username + ' in column index ' + usernameIndex);
  
  // Log all usernames for debugging
  var allUsernames = data.map(row => row[usernameIndex]);
  Logger.log('All usernames in sheet: ' + JSON.stringify(allUsernames));
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][usernameIndex] === username) {
      Logger.log('Username match found at row ' + (i + 2));
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = data[i][index];
      });
      return { data: obj, rowIndex: i + 2 }; // +2 because we shifted headers and rows are 1-indexed
    }
  }
  
  Logger.log('No user found with username: ' + username);
  return null;
}

// === USER AUTHENTICATION AND MANAGEMENT ===

/**
 * Authenticates a user by username and password
 */
function login(params) {
  try {
    var username = params.username;
    var password = params.password;
    
    Logger.log('Login attempt with username: ' + username);
    
    if (!username || !password) {
      Logger.log('Missing username or password');
      return { success: false, error: "Username and password are required" };
    }
    
    // Find user by username
    var user = findUserByUsername(username);
    
    if (!user) {
      Logger.log('User not found: ' + username);
      return { success: false, error: "Invalid username or password" };
    }
    
    Logger.log('User found: ' + JSON.stringify(user.data));
    
    // Check password
    Logger.log('Comparing passwords: input=' + password + ', stored=' + user.data.password);
    if (user.data.password !== password) {
      Logger.log('Password mismatch');
      return { success: false, error: "Invalid username or password" };
    }
    
    // Return user data without password
    var userData = {
      id: user.data.id,
      username: user.data.username,
      name: user.data.name,
      role: user.data.role,
      email: user.data.email
    };
    
    Logger.log('Login successful for: ' + username);
    
    return { 
      success: true, 
      user: userData,
      token: "session-token-" + new Date().getTime() // In a real app, generate a proper JWT or session token
    };
  } catch (error) {
    Logger.log('Login error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Creates a new user
 */
function createUser(params) {
  try {
    // Check if user with username already exists
    var existingUser = findUserByUsername(params.username);
    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }
    
    var sheet = SS.getSheetByName('User');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create new row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Generate ID if not provided
    var id = params.id || generateUniqueId();
    
    // Populate row data based on headers
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(id);
          break;
        case 'created_at':
        case 'updated_at':
          rowData.push(timestamp);
          break;
        default:
          rowData.push(params[header] || '');
      }
    });
    
    // Append new row
    sheet.appendRow(rowData);
    
    return { success: true, data: { id: id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Gets users (filtered by role if specified)
 */
function getUsers(params) {
  try {
    if (params.id) {
      // Get specific user by ID
      var record = findRecordById('User', params.id);
      if (!record) {
        return { success: false, error: "User not found" };
      }
      
      // Don't return password
      var userData = {...record.data};
      delete userData.password;
      
      return { success: true, data: userData };
    } else {
      // Get all users
      var users = getAllData('User');
      
      // Filter by role if specified
      if (params.role) {
        users = users.filter(function(user) {
          return user.role === params.role;
        });
      }
      
      // Remove passwords from results
      users = users.map(function(user) {
        var userData = {...user};
        delete userData.password;
        return userData;
      });
      
      return { success: true, data: users };
    }
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Updates a user
 */
function updateUser(params) {
  try {
    if (!params.id) {
      return { success: false, error: "ID is required" };
    }
    
    // Find the user
    var record = findRecordById('User', params.id);
    if (!record) {
      return { success: false, error: "User not found" };
    }
    
    // If updating username, check if it's unique
    if (params.username && params.username !== record.data.username) {
      var existingUser = findUserByUsername(params.username);
      if (existingUser) {
        return { success: false, error: "Username already exists" };
      }
    }
    
    var sheet = SS.getSheetByName('User');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create updated row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Update values based on parameters
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(params.id);
          break;
        case 'updated_at':
          rowData.push(timestamp);
          break;
        case 'created_at':
          rowData.push(record.data.created_at);
          break;
        default:
          // Use new value if provided, otherwise keep the old value
          rowData.push(params[header] !== undefined ? params[header] : record.data[header]);
      }
    });
    
    // Update the row
    sheet.getRange(record.rowIndex, 1, 1, rowData.length).setValues([rowData]);
    
    return { success: true, data: { id: params.id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Deletes a user
 */
function deleteUser(params) {
  try {
    if (!params.id) {
      return { success: false, error: "ID is required" };
    }
    
    // Find the user
    var record = findRecordById('User', params.id);
    if (!record) {
      return { success: false, error: "User not found" };
    }
    
    var sheet = SS.getSheetByName('User');
    
    // Delete the row
    sheet.deleteRow(record.rowIndex);
    
    return { success: true, data: { id: params.id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// === IMPLEMENTATION FOR KELAS (CLASS) ===

function getKelas(params) {
  try {
    if (params.id) {
      // Get specific class by ID
      var record = findRecordById('Kelas', params.id);
      if (!record) {
        return { success: false, error: "Kelas not found" };
      }
      return { success: true, data: record.data };
    } else {
      // Get all classes
      var data = getAllData('Kelas');
      return { success: true, data: data };
    }
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function createKelas(params) {
  try {
    var sheet = SS.getSheetByName('Kelas');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create new row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Generate ID if not provided
    var id = params.id || generateUniqueId();
    
    // Populate row data based on headers
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(id);
          break;
        case 'created_at':
        case 'updated_at':
          rowData.push(timestamp);
          break;
        default:
          rowData.push(params[header] || '');
      }
    });
    
    // Append new row
    sheet.appendRow(rowData);
    
    return { success: true, data: { id: id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function updateKelas(params) {
  try {
    if (!params.id) {
      return { success: false, error: "ID is required" };
    }
    
    // Find the record
    var record = findRecordById('Kelas', params.id);
    if (!record) {
      return { success: false, error: "Kelas not found" };
    }
    
    var sheet = SS.getSheetByName('Kelas');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create updated row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Update values based on parameters
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(params.id);
          break;
        case 'updated_at':
          rowData.push(timestamp);
          break;
        case 'created_at':
          rowData.push(record.data.created_at);
          break;
        default:
          // Use new value if provided, otherwise keep the old value
          rowData.push(params[header] !== undefined ? params[header] : record.data[header]);
      }
    });
    
    // Update the row
    sheet.getRange(record.rowIndex, 1, 1, rowData.length).setValues([rowData]);
    
    return { success: true, data: { id: params.id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function deleteKelas(params) {
  try {
    if (!params.id) {
      return { success: false, error: "ID is required" };
    }
    
    // Find the record
    var record = findRecordById('Kelas', params.id);
    if (!record) {
      return { success: false, error: "Kelas not found" };
    }
    
    var sheet = SS.getSheetByName('Kelas');
    
    // Delete the row
    sheet.deleteRow(record.rowIndex);
    
    return { success: true, data: { id: params.id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// === IMPLEMENT REMAINING ENTITY OPERATIONS SIMILARLY ===
// (getSiswa, createSiswa, updateSiswa, deleteSiswa, etc.)

// === SISWA (STUDENT) OPERATIONS ===

function getSiswa(params) {
  try {
    // Accept either id or siswa_id for finding a specific student
    var id = params.id || params.siswa_id;
    if (id) {
      // Get specific student by ID
      var record = findRecordById('Siswa', id);
      if (!record) {
        return { success: false, error: "Siswa not found" };
      }
      return { success: true, data: record.data };
    } else if (params.kelas_id) {
      // Get students by class ID
      var allStudents = getAllData('Siswa');
      var filteredStudents = allStudents.filter(function(student) {
        return student.kelas_id === params.kelas_id;
      });
      return { success: true, data: filteredStudents };
    } else {
      // Get all students
      var data = getAllData('Siswa');
      return { success: true, data: data };
    }
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function createSiswa(params) {
  try {
    var sheet = SS.getSheetByName('Siswa');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create new row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Generate ID if not provided
    var id = params.id || generateUniqueId();
    
    // Populate row data based on headers
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(id);
          break;
        case 'created_at':
        case 'updated_at':
          rowData.push(timestamp);
          break;
        default:
          rowData.push(params[header] || '');
      }
    });
    
    // Append new row
    sheet.appendRow(rowData);
    
    return { success: true, data: { id: id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function updateSiswa(params) {
  try {
    // Accept either id or siswa_id
    var id = params.id || params.siswa_id;
    if (!id) {
      return { success: false, error: "ID is required (either id or siswa_id)" };
    }
    
    // Find the record
    var record = findRecordById('Siswa', id);
    if (!record) {
      return { success: false, error: "Siswa not found" };
    }
    
    var sheet = SS.getSheetByName('Siswa');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create updated row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Update values based on parameters
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(id);
          break;
        case 'updated_at':
          rowData.push(timestamp);
          break;
        case 'created_at':
          rowData.push(record.data.created_at);
          break;
        default:
          // Use new value if provided, otherwise keep the old value
          rowData.push(params[header] !== undefined ? params[header] : record.data[header]);
      }
    });
    
    // Update the row
    sheet.getRange(record.rowIndex, 1, 1, rowData.length).setValues([rowData]);
    
    return { success: true, data: { id: id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function deleteSiswa(params) {
  try {
    // Accept either id or siswa_id
    var id = params.id || params.siswa_id;
    Logger.log("deleteSiswa called with params: " + JSON.stringify(params));
    Logger.log("Extracted ID: " + id + " (type: " + typeof id + ")");
    
    if (!id) {
      Logger.log("No ID provided in parameters");
      return { success: false, error: "ID is required (either id or siswa_id)" };
    }
    
    // Get all student IDs from the sheet for debugging
    var sheet = SS.getSheetByName('Siswa');
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      var headers = data.shift();
      var allIds = data.map(function(row) { return String(row[0]); });
      Logger.log("All student IDs in sheet: " + JSON.stringify(allIds));
      Logger.log("Looking for ID: " + id + " in sheet");
    } else {
      Logger.log("Siswa sheet not found!");
    }
    
    // Find the record
    var record = findRecordById('Siswa', id);
    Logger.log("Record found: " + (record ? "Yes" : "No"));
    
    if (!record) {
      return { success: false, error: "Siswa not found" };
    }
    
    Logger.log("About to delete row at index: " + record.rowIndex);
    
    // Delete the row
    sheet.deleteRow(record.rowIndex);
    Logger.log("Row deleted successfully");
    
    return { success: true, data: { id: id } };
  } catch (error) {
    Logger.log("Error in deleteSiswa: " + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Debug function to dump all Siswa data
 */
function debugSiswaData() {
  var sheet = SS.getSheetByName('Siswa');
  if (!sheet) {
    Logger.log("Siswa sheet not found!");
    return { success: false, error: "Siswa sheet not found" };
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  
  Logger.log("Headers: " + JSON.stringify(headers));
  
  var rows = [];
  for (var i = 0; i < data.length; i++) {
    var row = {};
    headers.forEach(function(header, index) {
      row[header] = data[i][index];
    });
    rows.push(row);
    Logger.log("Row " + i + ": " + JSON.stringify(row));
  }
  
  return { success: true, data: rows };
}

/**
 * Creates a response with CORS headers
 */
function createCORSResponse(jsonText) {
  return ContentService.createTextOutput(jsonText)
    .setMimeType(ContentService.MimeType.JSON);
}

// === TUGAS (ASSIGNMENT) OPERATIONS ===

function getTugas(params) {
  try {
    if (params.id) {
      // Get specific assignment by ID
      var record = findRecordById('Tugas', params.id);
      if (!record) {
        return { success: false, error: "Tugas not found" };
      }
      return { success: true, data: record.data };
    } else if (params.kelas_id) {
      // Get assignments by class ID
      var allTugas = getAllData('Tugas');
      var filteredTugas = allTugas.filter(function(tugas) {
        return tugas.kelas_id === params.kelas_id;
      });
      return { success: true, data: filteredTugas };
    } else {
      // Get all assignments
      var data = getAllData('Tugas');
      return { success: true, data: data };
    }
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function createTugas(params) {
  try {
    var sheet = SS.getSheetByName('Tugas');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create new row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Generate ID if not provided
    var id = params.id || generateUniqueId();
    
    // Populate row data based on headers
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(id);
          break;
        case 'created_at':
        case 'updated_at':
          rowData.push(timestamp);
          break;
        default:
          rowData.push(params[header] || '');
      }
    });
    
    // Append new row
    sheet.appendRow(rowData);
    
    return { success: true, data: { id: id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function updateTugas(params) {
  try {
    if (!params.id) {
      return { success: false, error: "ID is required" };
    }
    
    // Find the record
    var record = findRecordById('Tugas', params.id);
    if (!record) {
      return { success: false, error: "Tugas not found" };
    }
    
    var sheet = SS.getSheetByName('Tugas');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create updated row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Update values based on parameters
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(params.id);
          break;
        case 'updated_at':
          rowData.push(timestamp);
          break;
        case 'created_at':
          rowData.push(record.data.created_at);
          break;
        default:
          // Use new value if provided, otherwise keep the old value
          rowData.push(params[header] !== undefined ? params[header] : record.data[header]);
      }
    });
    
    // Update the row
    sheet.getRange(record.rowIndex, 1, 1, rowData.length).setValues([rowData]);
    
    return { success: true, data: { id: params.id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function deleteTugas(params) {
  try {
    if (!params.id) {
      return { success: false, error: "ID is required" };
    }
    
    // Find the record
    var record = findRecordById('Tugas', params.id);
    if (!record) {
      return { success: false, error: "Tugas not found" };
    }
    
    var sheet = SS.getSheetByName('Tugas');
    
    // Delete the row
    sheet.deleteRow(record.rowIndex);
    
    return { success: true, data: { id: params.id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// === NILAI (GRADE) OPERATIONS ===

function getNilai(params) {
  try {
    if (params.id) {
      // Get specific grade by ID
      var record = findRecordById('Nilai', params.id);
      if (!record) {
        return { success: false, error: "Nilai not found" };
      }
      return { success: true, data: record.data };
    } else if (params.siswa_id) {
      // Get grades by student ID
      var allNilai = getAllData('Nilai');
      var filteredNilai = allNilai.filter(function(nilai) {
        return nilai.siswa_id === params.siswa_id;
      });
      return { success: true, data: filteredNilai };
    } else if (params.tugas_id) {
      // Get grades by assignment ID
      var allNilai = getAllData('Nilai');
      var filteredNilai = allNilai.filter(function(nilai) {
        return nilai.tugas_id === params.tugas_id;
      });
      return { success: true, data: filteredNilai };
    } else {
      // Get all grades
      var data = getAllData('Nilai');
      return { success: true, data: data };
    }
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function createNilai(params) {
  try {
    var sheet = SS.getSheetByName('Nilai');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create new row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Generate ID if not provided
    var id = params.id || generateUniqueId();
    
    // Populate row data based on headers
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(id);
          break;
        case 'created_at':
        case 'updated_at':
          rowData.push(timestamp);
          break;
        default:
          rowData.push(params[header] || '');
      }
    });
    
    // Append new row
    sheet.appendRow(rowData);
    
    return { success: true, data: { id: id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function updateNilai(params) {
  try {
    if (!params.id) {
      return { success: false, error: "ID is required" };
    }
    
    // Find the record
    var record = findRecordById('Nilai', params.id);
    if (!record) {
      return { success: false, error: "Nilai not found" };
    }
    
    var sheet = SS.getSheetByName('Nilai');
    
    // Get headers
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create updated row data
    var rowData = [];
    var timestamp = getCurrentTimestamp();
    
    // Update values based on parameters
    headers.forEach(function(header) {
      switch(header) {
        case 'id':
          rowData.push(params.id);
          break;
        case 'updated_at':
          rowData.push(timestamp);
          break;
        case 'created_at':
          rowData.push(record.data.created_at);
          break;
        default:
          // Use new value if provided, otherwise keep the old value
          rowData.push(params[header] !== undefined ? params[header] : record.data[header]);
      }
    });
    
    // Update the row
    sheet.getRange(record.rowIndex, 1, 1, rowData.length).setValues([rowData]);
    
    return { success: true, data: { id: params.id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function deleteNilai(params) {
  try {
    if (!params.id) {
      return { success: false, error: "ID is required" };
    }
    
    // Find the record
    var record = findRecordById('Nilai', params.id);
    if (!record) {
      return { success: false, error: "Nilai not found" };
    }
    
    var sheet = SS.getSheetByName('Nilai');
    
    // Delete the row
    sheet.deleteRow(record.rowIndex);
    
    return { success: true, data: { id: params.id } };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Implement paginated data retrieval functions

/**
 * Helper function to get paginated data from a sheet
 * @param {Object} params - Request parameters
 * @param {Sheet} sheet - The sheet to get data from
 * @param {Function} filterFn - Optional filter function for rows
 * @param {Function} transformFn - Optional transform function for rows
 * @return {Object} Paginated result with data, totalItems, and hasMore flag
 */
function getPaginatedSheetData(params, sheet, filterFn, transformFn) {
  // Get pagination parameters
  const page = parseInt(params.page) || 1;
  const pageSize = parseInt(params.pageSize) || 10;
  
  // Calculate indices
  const startRow = (page - 1) * pageSize + 2; // +2 to skip header row
  const maxRows = sheet.getLastRow() - 1; // -1 for header
  
  // Get headers
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Get data for the requested page
  let rowCount = Math.min(pageSize, maxRows - (startRow - 2));
  if (rowCount < 1) rowCount = 0;
  
  let data = [];
  if (rowCount > 0) {
    data = sheet.getRange(startRow, 1, rowCount, sheet.getLastColumn()).getValues();
  }
  
  // Filter and transform data if needed
  let resultData = data;
  let totalFilteredItems = maxRows;
  
  if (filterFn) {
    // Apply filter to the current page data
    resultData = data.filter((row, index) => filterFn(row, headers, startRow + index - 1));
    
    // Calculate total items matching the filter (this requires scanning all data)
    if (page === 1) {
      // For performance reasons, only do a full count on the first page request
      const allData = sheet.getRange(2, 1, maxRows, sheet.getLastColumn()).getValues();
      totalFilteredItems = allData.filter((row, index) => filterFn(row, headers, index + 2)).length;
    }
  }
  
  // Apply transformation if provided
  if (transformFn) {
    resultData = resultData.map((row, index) => transformFn(row, headers, startRow + index - 1));
  } else {
    // Default transformation (convert to object with header keys)
    resultData = resultData.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });
  }
  
  // Calculate hasMore flag
  const hasMore = startRow + rowCount - 2 < totalFilteredItems;
  
  return {
    success: true,
    data: resultData,
    pagination: {
      page: page,
      pageSize: pageSize,
      totalItems: totalFilteredItems,
      totalPages: Math.ceil(totalFilteredItems / pageSize),
      hasMore: hasMore
    }
  };
}

// Add paginated versions of the getter functions for all entity types

// Paginated Kelas (Class)
function getKelasPaginated(params) {
  try {
    const sheet = SS.getSheetByName("Kelas");
    if (!sheet) throw new Error("Sheet 'Kelas' not found");
    
    // Optional filter function
    let filterFn = null;
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filterFn = (row, headers) => {
        // Search in name, tahun_ajaran, or wali_kelas
        return row[headers.indexOf('nama')].toString().toLowerCase().includes(searchTerm) ||
               row[headers.indexOf('tahun_ajaran')].toString().toLowerCase().includes(searchTerm) ||
               row[headers.indexOf('wali_kelas')].toString().toLowerCase().includes(searchTerm);
      };
    }
    
    return getPaginatedSheetData(params, sheet, filterFn);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Paginated Siswa (Student)
function getSiswaPaginated(params) {
  try {
    const sheet = SS.getSheetByName("Siswa");
    if (!sheet) throw new Error("Sheet 'Siswa' not found");
    
    // Optional filter function
    let filterFn = null;
    if (params.kelas_id || params.search) {
      filterFn = (row, headers) => {
        let match = true;
        
        // Filter by kelas_id if provided
        if (params.kelas_id) {
          match = match && row[headers.indexOf('kelas_id')] == params.kelas_id;
        }
        
        // Filter by search term if provided
        if (params.search && match) {
          const searchTerm = params.search.toLowerCase();
          match = match && (
            row[headers.indexOf('nama')].toString().toLowerCase().includes(searchTerm) ||
            row[headers.indexOf('nis')].toString().toLowerCase().includes(searchTerm)
          );
        }
        
        return match;
      };
    }
    
    return getPaginatedSheetData(params, sheet, filterFn);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Paginated Tugas (Assignment)
function getTugasPaginated(params) {
  try {
    const sheet = SS.getSheetByName("Tugas");
    if (!sheet) throw new Error("Sheet 'Tugas' not found");
    
    // Optional filter function
    let filterFn = null;
    if (params.kelas_id || params.search) {
      filterFn = (row, headers) => {
        let match = true;
        
        // Filter by kelas_id if provided
        if (params.kelas_id) {
          match = match && row[headers.indexOf('kelas_id')] == params.kelas_id;
        }
        
        // Filter by search term if provided
        if (params.search && match) {
          const searchTerm = params.search.toLowerCase();
          match = match && (
            row[headers.indexOf('judul')].toString().toLowerCase().includes(searchTerm) ||
            row[headers.indexOf('deskripsi')].toString().toLowerCase().includes(searchTerm)
          );
        }
        
        return match;
      };
    }
    
    return getPaginatedSheetData(params, sheet, filterFn);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Paginated Nilai (Grade)
function getNilaiPaginated(params) {
  try {
    const sheet = SS.getSheetByName("Nilai");
    if (!sheet) throw new Error("Sheet 'Nilai' not found");
    
    // Optional filter function
    let filterFn = null;
    if (params.siswa_id || params.tugas_id) {
      filterFn = (row, headers) => {
        let match = true;
        
        // Filter by siswa_id if provided
        if (params.siswa_id) {
          match = match && row[headers.indexOf('siswa_id')] == params.siswa_id;
        }
        
        // Filter by tugas_id if provided
        if (params.tugas_id && match) {
          match = match && row[headers.indexOf('tugas_id')] == params.tugas_id;
        }
        
        return match;
      };
    }
    
    return getPaginatedSheetData(params, sheet, filterFn);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function checkAdminUser() {
  var sheet = SS.getSheetByName('User');
  if (!sheet) {
    return { success: false, error: "User sheet not found" };
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  
  // Find admin user
  var adminUser = data.find(row => row[headers.indexOf('role')] === 'admin');
  
  if (!adminUser) {
    // Admin user not found, create a new one
    var newAdminUser = [
      generateUniqueId(),    // id
      'admin',               // username
      'admin123',            // password (in a real app, this should be hashed)
      'Administrator',       // name
      'admin',               // role
      'admin@example.com',   // email
      getCurrentTimestamp(), // created_at
      getCurrentTimestamp()  // updated_at
    ];
    sheet.appendRow(newAdminUser);
    return { success: true, message: "Admin user created" };
  } else {
    return { success: true, message: "Admin user already exists" };
  }
}
