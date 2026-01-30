import axios from "axios";

const client = axios.create({
    // Ajusta el puerto si tu backend corre en el 4000 o 3000
    baseURL: "http://localhost:4000/api", 
    withCredentials: true
});

// Interceptor: Antes de cada petición, inyectamos el Token si existe
client.interceptors.request.use((config) => {
    const token = localStorage.getItem("jm_token"); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default client;