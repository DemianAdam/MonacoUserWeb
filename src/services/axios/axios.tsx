import axios, { AxiosError } from "axios";
export const API_URL = "https://script.google.com/macros/s/AKfycbzXjuhTwqIpyKpxZnqV39UPvny3WBj-9UhKh-oM6iw31oI0fDofN90Lq6uXE6-bPx0/exec";
const axiosInstance = axios.create({
    baseURL: API_URL,
});

axiosInstance.interceptors.response.use(
    (response) => {
        if (response.data.statusCode >= 400) {
            console.log(response.data);
            const axiosError = new AxiosError(response.data.description, response.data.code || "ERR", undefined, null, response);
            axiosError.status = response.data.statusCode;
            axiosError.name = response.data.reason;
            return Promise.reject(axiosError);
        }
        console.log(response);

        return response;
    },
    (error) => {
        console.log(error);

        return Promise.reject(error);
    }
)

export default axiosInstance;