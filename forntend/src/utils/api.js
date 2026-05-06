import axios from 'axios';
const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

axios.defaults.withCredentials = true;

const buildApiUrl = (url) => {
    const normalizedUrl = String(url || '');

    if (!normalizedUrl) {
        return apiUrl;
    }

    return `${apiUrl}${normalizedUrl.startsWith('/') ? '' : '/'}${normalizedUrl}`;
};

const getHeaders = (contentType = 'application/json') => ({
    ...(contentType ? { 'Content-Type': contentType } : {}),
});

export const postData = async (url, formData) => {
    try {
        const response = await fetch(buildApiUrl(url), {
            method: 'POST',
            headers: getHeaders('application/json'),
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return {
            error: true,
            success: false,
            message: 'Network error. Please try again.'
        };
    }
}

export const fetchDataFromApi = async (url) => {
    try {
        const params = {
            headers: {
                ...getHeaders('application/json'),
            },
            withCredentials: true,
        };
        const { data } = await axios.get(buildApiUrl(url), params);
        return data;
    } catch (error) {
        console.log(error);
        return error;
    }
}

export const uploadImage = async (url, updateData) => {
    const params = {
        headers: {
            ...getHeaders('multipart/form-data'),
        },
        withCredentials: true,
    }

    var response;
    await axios.put(buildApiUrl(url), updateData, params).then((res) => {
        response = res;
    })
    return response;
}

export const editData = async (url, updateData) => {
    const params = {
        headers: {
            ...getHeaders('application/json'),
        },
        withCredentials: true,
    }

    const res = await axios.patch(buildApiUrl(url), updateData, params);
    return res.data;
}

export const deleteData = async (url) => {
    const params = {
        headers: {
            ...getHeaders('application/json'),
        },
        withCredentials: true,
    }
    const { data } = await axios.delete(buildApiUrl(url), params);
    return data;
}