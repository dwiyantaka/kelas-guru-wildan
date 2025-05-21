// API functions for communicating with Google Apps Script backend
// Following CORS bypass technique rules

// Replace with your deployed Google Apps Script web app URL
// THIS MUST MATCH YOUR LATEST DEPLOYMENT URL FROM THE UPDATED SCRIPT
// THAT USES THE SPREADSHEET ID: 1aJUpU96xdSkSeypE-x7sJJku6pSr3vgC6aL1hF15wNQ
const API_URL = 'https://script.google.com/macros/s/URL_DEPLOYMENT/exec';

// You may need to update this URL after deploying your updated script
// Follow these steps:
// 1. Go to your Google Apps Script Editor
// 2. Click Deploy > New deployment
// 3. Choose "Web app" as the deployment type 
// 4. Set "Execute as" to "Me" (your Google account)
// 5. Set "Who has access" to "Anyone"
// 6. Click "Deploy" and copy the resulting URL here

// Generic API function for making requests to the GAS backend
async function callApi(action, params = {}) {
    try {
        // Combine action with other parameters
        const data = {
            action,
            ...params
        };
        
        // Create URLSearchParams object (produces application/x-www-form-urlencoded format)
        const formData = new URLSearchParams(data);
        
        // Make fetch request following the CORS rules
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
            // Note: No custom headers to avoid preflight
            // Don't set mode: 'no-cors' as it prevents access to the response
        });
        
        // Parse the JSON response
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        // If fetch fails, try the JSONP approach as fallback
        return await fetchDataWithJSONP(action, params);
    }
}

// Fallback method using JSONP-like approach for CORS issues
async function fetchDataWithJSONP(action, params = {}) {
    return new Promise((resolve) => {
        // Create a unique callback name
        const callbackName = 'jsonpCallback_' + Date.now();
        
        // Create the full URL with callback parameter
        let url = `${API_URL}?action=${action}&callback=${callbackName}`;
        
        // Add other params to URL
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                url += `&${key}=${encodeURIComponent(typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key])}`;
            }
        }
        
        // Define the callback function
        window[callbackName] = function(data) {
            // Clean up by removing the script tag and deleting the callback
            document.body.removeChild(script);
            delete window[callbackName];
            
            // Resolve the promise with the data
            resolve(data);
        };
        
        // Create script element
        const script = document.createElement('script');
        script.src = url;
        script.onerror = function() {
            // Clean up
            document.body.removeChild(script);
            delete window[callbackName];
            
            // Resolve with error
            resolve({ 
                success: false, 
                error: 'Failed to load data via JSONP' 
            });
        };
        
        // Add script to document to initiate request
        document.body.appendChild(script);
    });
}

// === Authentication API ===
async function login(username, password) {
    return callApi('login', { username, password });
}

// === Generic CRUD Operations ===
async function getAllData(entityType) {
    return callApi('get' + entityType);
}

async function getDataById(entityType, id) {
    return callApi('get' + entityType, { id });
}

async function createData(entityType, data) {
    return callApi('create' + entityType, data);
}

async function updateData(entityType, id, data) {
    return callApi('update' + entityType, { id, ...data });
}

async function deleteData(entityType, id) {
    return callApi('delete' + entityType, { id });
}

// === Paginated Data Operations ===
async function getPaginatedData(entityType, page = 1, pageSize = 10, filters = {}) {
    return callApi('get' + entityType, { 
        page, 
        pageSize, 
        ...filters,
        paginated: true
    });
}

// === Kelas (Class) API ===
async function getKelas(id) {
    return id ? getDataById('Kelas', id) : getAllData('Kelas');
}

async function getPaginatedKelas(page = 1, pageSize = 10, filters = {}) {
    return callApi('getKelas', { 
        page, 
        pageSize, 
        ...filters,
        paginated: true
    });
}

async function createKelas(kelasData) {
    return createData('Kelas', kelasData);
}

async function updateKelas(id, kelasData) {
    return updateData('Kelas', id, kelasData);
}

async function deleteKelas(id) {
    return deleteData('Kelas', id);
}

// === Siswa (Student) API ===
async function getSiswa(id, kelas_id) {
    const params = {};
    if (id) params.id = id;
    if (kelas_id) params.kelas_id = kelas_id;
    return callApi('getSiswa', params);
}

async function getPaginatedSiswa(page = 1, pageSize = 10, filters = {}) {
    return getPaginatedData('Siswa', page, pageSize, filters);
}

async function createSiswa(siswaData) {
    return createData('Siswa', siswaData);
}

async function updateSiswa(id, siswaData) {
    return updateData('Siswa', id, siswaData);
}

async function deleteSiswa(id) {
    return deleteData('Siswa', id);
}

// === Tugas (Assignment) API ===
async function getTugas(id, kelas_id) {
    const params = {};
    if (id) params.id = id;
    if (kelas_id) params.kelas_id = kelas_id;
    return callApi('getTugas', params);
}

async function getPaginatedTugas(page = 1, pageSize = 10, filters = {}) {
    return getPaginatedData('Tugas', page, pageSize, filters);
}

async function createTugas(tugasData) {
    return createData('Tugas', tugasData);
}

async function updateTugas(id, tugasData) {
    return updateData('Tugas', id, tugasData);
}

async function deleteTugas(id) {
    return deleteData('Tugas', id);
}

// === Nilai (Grade) API ===
async function getNilai(id, siswa_id, tugas_id) {
    const params = {};
    if (id) params.id = id;
    if (siswa_id) params.siswa_id = siswa_id;
    if (tugas_id) params.tugas_id = tugas_id;
    return callApi('getNilai', params);
}

async function getPaginatedNilai(page = 1, pageSize = 10, filters = {}) {
    return getPaginatedData('Nilai', page, pageSize, filters);
}

async function createNilai(nilaiData) {
    return createData('Nilai', nilaiData);
}

async function updateNilai(id, nilaiData) {
    return updateData('Nilai', id, nilaiData);
}

async function deleteNilai(id) {
    return deleteData('Nilai', id);
} 