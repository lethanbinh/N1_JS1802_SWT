import { cilLockLocked, cilUser } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import fetchData from '../../util/ApiConnection';
import UserStorage from '../../util/UserStorage';
import loginImage from '../../views/login/1232.png'; // Update with the correct path to your image
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const validationErrors = validateInputs();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    fetchData("http://localhost:8080/api/v1/auth/login", 'POST', { username, password })
      .then(data => {
        if (data !== null) {
          if (data.status === 'SUCCESS') {
            UserStorage.storeAuthenticatedUser(
              data.payload.username,
              data.payload.accessToken,
              data.payload.refreshToken,
              data.payload.roleName,
              data.payload.id
            )

            redirectToHomePage(data.payload.roleName);
          } else {
            // Handle login failure
            console.log('Invalid credentials');
            setErrors({ general: 'Username or password Error' });
          }
        } else {
          // Handle login failure
          console.log('Invalid credentials');
          setErrors({ general: 'Username or password Error' });
        }
      })
  };

  const validateInputs = () => {
    const errors = {};

    // Username validations
    if (!username) {
      errors.username = 'Username is required (T1)';
    } else {
      if (/[^a-zA-Z0-9]/.test(username)) {
        errors.username = 'Special characters are not allowed (T2)';
      }
      if (!/^[a-zA-Z0-9]/.test(username)) {
        errors.username = 'First character cannot be a space (T3.1)';
      }
    }

    // Password validations
    if (!password) {
      errors.password = 'Password is required (T4)';
    } else {
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.password = 'Password must contain at least one special character (T5)';
      }
      if (!/\d/.test(password)) {
        errors.password = 'Password must contain at least one number (T6)';
      }
      if (!/[A-Z]/.test(password)) {
        errors.password = 'Password must contain at least one uppercase letter (T7)';
      }
      if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters long (T8)';
      }
      if (password.startsWith(' ')) {
        errors.password = 'First character cannot be a space (T9)';
      }
    }

    return errors;
  };

  const redirectToHomePage = (userRole) => {
    switch (userRole.toUpperCase()) {
      case 'ADMIN':
        navigate('/admin-dashboard/account-list');
        break;
      case 'STAFF':
        navigate('/staff-dashboard/invoice');
        break;
      case 'MANAGER':
        navigate('/manager-dashboard/staff-list');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <div className="bg-image">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup className='justify-content-center ml-2'>
              <CCard className="login-card p-3">
                <img src={loginImage} alt="Login Illustration" className="login-image" />
                <CCardBody className="login-form">
                  <CForm onSubmit={handleLogin}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>
                    {errors.general && <p className="text-danger">{errors.general}</p>}
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        invalid={!!errors.username}
                      />
                      {errors.username && <p className="text-danger">{errors.username}</p>}
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        invalid={!!errors.password}
                      />
                      {errors.password && <p className="text-danger">{errors.password}</p>}
                    </CInputGroup>
                    <CRow>
                      <CCol xs={6}>
                        <CButton type="submit" color="primary" className="px-4 custom-btn custom-btn-primary">
                          Login
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <Link to="/forgot-password" className="custom-link">
                          Forgot password?
                        </Link>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Login;
