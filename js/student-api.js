// API functions for Students page - Uses callApi function from api.js
// The API_URL is already defined in api.js

// Student functions
async function getSiswa(id, kelas_id) {
    const params = {};
    if (id) params.id = id;
    if (kelas_id) params.kelas_id = kelas_id;
    return callApi('getSiswa', params);
}

async function createSiswa(siswaData) {
    return callApi('createSiswa', siswaData);
}

async function updateSiswa(id, siswaData) {
    // Ensure both id formats are included
    const params = { 
        ...siswaData,
        id: String(id),
        siswa_id: String(id)
    };
    return callApi('updateSiswa', params);
}

async function deleteSiswa(id) {
    // Try both parameter names to ensure compatibility with backend
    return callApi('deleteSiswa', { 
        id: String(id),
        siswa_id: String(id) 
    });
}

// Class function
async function getKelas(id) {
    const params = {};
    if (id) params.id = id;
    return callApi('getKelas', params);
}

// Function to fetch class options for dropdowns
async function fetchClassOptions() {
    try {
        // Get all classes from API
        const response = await getKelas();
        
        if (response.success && Array.isArray(response.data)) {
            // Return the classes data
            return response.data;
        } else {
            console.error('Error fetching classes:', response.error || 'Unknown error');
            return [];
        }
    } catch (error) {
        console.error('Exception fetching classes:', error);
        return [];
    }
}

// Paginated student data retrieval
async function getPaginatedSiswa(page = 1, pageSize = 20, filters = {}) {
    return callApi('getSiswa', { 
        page, 
        pageSize, 
        ...filters,
        paginated: true
    });
} 