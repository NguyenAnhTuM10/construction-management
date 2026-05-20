import axiosClient from './axiosClient';

const forecastApi = {
  getLatest:      () => axiosClient.get('/forecast/latest'),
  getByProduct:   (productId) => axiosClient.get(`/forecast/product/${productId}`),
  trigger:        () => axiosClient.post('/forecast/trigger'),
};

export default forecastApi;
