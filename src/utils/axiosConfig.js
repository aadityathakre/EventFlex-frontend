import axios from 'axios';

// Set default axios config to include credentials
axios.defaults.withCredentials = true;

console.log("✅ Axios configured with withCredentials: true");

export default axios;
