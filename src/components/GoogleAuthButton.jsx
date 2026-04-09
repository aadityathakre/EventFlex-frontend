import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { serverURL } from '../App.jsx';

const GoogleAuthButton = ({ onSuccess, onError }) => {
  const handleSuccess = async (credentialResponse) => {
    try {
      // Decode the JWT to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      
      const result = await axios.post(
        `${serverURL}/auth/users/google-auth`,
        { 
          email: decoded.email,
          name: decoded.name,
          googleId: decoded.sub,
          picture: decoded.picture
        },
        { withCredentials: true }
      );

      if (result.data.success) {
        onSuccess(result.data.data);
      } else {
        onError(result.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google Auth error:', error);
      onError(error.response?.data?.message || 'Google authentication failed');
    }
  };

  const handleError = () => {
    onError('Google authentication failed. Please try again.');
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="filled_black"
        size="large"
        width="100%"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
};

export default GoogleAuthButton;
