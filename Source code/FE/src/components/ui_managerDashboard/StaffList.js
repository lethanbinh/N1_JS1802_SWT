import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem
} from '@coreui/react';
import React, { useEffect, useState } from 'react';
import '../../customStyles.css';
import fetchData from '../../util/ApiConnection';
import convertDateToJavaFormat from '../../util/DateConvert';
import UserStorage from '../../util/UserStorage';
import { cilHamburgerMenu } from '@coreui/icons';
import CIcon from '@coreui/icons-react';

const StaffList = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [userInfo, setUserInfo] = useState(UserStorage.getAuthenticatedUser());
  const [visible, setVisible] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deletedUsername, setDeletedUsername] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationInfo, setConfirmationInfo] = useState({ username: "", password: "" });
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [deleteSuccessModalVisible, setDeleteSuccessModalVisible] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stalls, setStalls] = useState([]);

  const handleEdit = (id) => {
    setEditingRow(id);
    setFormData(data.find((row) => row.id === id));
    setErrorMessage("");
    setEditModalVisible(true);
    setIsNew(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value === "null" ? null : value });
  };

  const handleSearchChange = (event) => {
    const { value } = event.target;
    setSearchTerm(value);
    if (value === "") {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(row => row.fullName.toLowerCase().includes(value.toLowerCase())));
    }
  };

  const handleAddNew = () => {
    setFormData({
      id: '',
      username: '',
      fullName: '',
      password: '',
      phone: '',
      email: '',
      address: '',
      birthday: '',
      roleName: 'Staff',
      stallId: null,
    });
    setErrorMessage('');
    setEditModalVisible(true);
    setIsNew(true);
  };

  const handleSave = () => {
    const requiredFields = ['username', 'fullName', 'password', 'phone', 'email', 'address', 'birthday'];
    const emptyFields = requiredFields.filter(field => !formData[field]);

    if (emptyFields.length > 0) {
      setErrorMessage(`Please fill all the fields: ${emptyFields.join(', ')}`);
      setErrorModalVisible(true);
      return;
    }

    const birthdayDate = new Date(formData.birthday);
    const todayDate = new Date();
    if (birthdayDate > todayDate) {
      setErrorMessage("Birthday cannot be later than today.");
      setErrorModalVisible(true);
      return;
    }

    const duplicateUsername = data.some(row => row.username === formData.username && row.id !== editingRow);
    const duplicatePhone = data.some(row => row.phone === formData.phone && row.id !== editingRow);
    const duplicateEmail = data.some(row => row.email === formData.email && row.id !== editingRow);
    const duplicateStallId = formData.stallId !== null && data.some(row => row.stallId === formData.stallId && row.id !== editingRow);

    console.log(formData.password)
    const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$/
    if (!regexPassword.test(formData.password)) {
      setErrorMessage("Password must be at least 6 characters, 1 uppercase letter, 1 number, 1 special character");
      setErrorModalVisible(true);
      return;
    }

    if (duplicateUsername) {
      setErrorMessage("Username already exists. Please use a unique username.");
      setErrorModalVisible(true);
      return;
    }

    if (duplicatePhone) {
      setErrorMessage("Phone number already exists. Please use a unique phone number.");
      setErrorModalVisible(true);
      return;
    }

    if (duplicateEmail) {
      setErrorMessage("Email already exists. Please use a unique email.");
      setErrorModalVisible(true);
      return;
    }

    if (duplicateStallId) {
      setErrorMessage("Stall ID already exists. Please use a unique Stall ID.");
      setErrorModalVisible(true);
      return;
    }

    let newData;
    let newId = null;
    if (isNew) {
      newId = data.length ? Math.max(...data.map(row => row.id)) + 1 : 1;
      const newRow = { ...formData, id: newId, status: true };
      newData = [...data, newRow];
    } else {
      newData = data.map((row) => {
        if (row.id === editingRow) {
          return { ...row, ...formData };
        }
        return row;
      });
    }

    const dataFromInput = newData.find(row => row.id === (isNew ? newId : editingRow));

    const savedData = {
      username: dataFromInput.username || "string",
      fullName: dataFromInput.fullName || "string",
      phone: dataFromInput.phone || "0374422448",
      email: dataFromInput.email || "string",
      address: dataFromInput.address || "string",
      avatar: "",
      password: dataFromInput.password,
      birthday: convertDateToJavaFormat(dataFromInput.birthday) || "2024-06-16T08:48:44.695Z",
      status: dataFromInput.status ? true : false,
      roleId: 2,
      stallId: dataFromInput.stallId !== null ? dataFromInput.stallId : null
    };

    const apiCall = editingRow ?
      fetchData(`http://localhost:8080/api/v1/users/id/${editingRow}`, 'PUT', savedData, userInfo.accessToken) :
      fetchData(`http://localhost:8080/api/v1/users`, 'POST', savedData, userInfo.accessToken);

    apiCall
      .then(response => {
        if (response.status === 'SUCCESS') {
          refreshData();
          setEditingRow(null);
          setEditModalVisible(false);
          setIsNew(false);

          if (isNew) {
            setConfirmationInfo({ username: formData.username, password: formData.password });
            setConfirmationModalVisible(true);
          } else {
            setSuccessModalVisible(true);
          }

          setFormData({}); // Reset form data after saving
        } else {
          throw new Error('Failed to save data');
        }
      })
      .catch((error) => {
        console.error("Error saving data:", error);
        setErrorMessage("Error saving data. Please try again.");
        setErrorModalVisible(true);
      });
  };

  const handleDelete = (id) => {
    setVisible(false);
    fetchData(`http://localhost:8080/api/v1/users/${deleteId}`, 'DELETE', null, userInfo.accessToken)
      .then(() => {
        refreshData();
        setDeleteId(null);
        setDeleteSuccessModalVisible(true);
      })
      .catch((error) => {
        console.error("Error deleting row:", error);
      });
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setFormData({});
  };

  const preprocessData = (data, stalls) => {
    return data.map(row => {
      const stall = stalls.find(stall => stall.id === row.stallId);
      return { ...row, stallName: stall ? stall.name : "N/A" };
    });
  };

  const refreshData = () => {
    fetchData("http://localhost:8080/api/v1/users", 'GET', null, userInfo.accessToken)
      .then(data => {
        fetchStalls().then(stalls => {
          const preprocessedData = preprocessData(data.payload, stalls);
          setData(preprocessedData);
          setFilteredData(preprocessedData);
        });
      });
  };

  const fetchStalls = () => {
    return fetchData("http://localhost:8080/api/v1/stalls", 'GET', null, userInfo.accessToken)
      .then(data => {
        setStalls(data.payload);
        return data.payload;
      })
      .catch(error => {
        console.error("Error fetching stalls:", error);
      });
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Staff List</strong>
          </CCardHeader>
          <CCardBody>
            <CFormInput
              type="text"
              placeholder="Search by full name"
              value={searchTerm}
              onChange={handleSearchChange}
              className="mb-3"
            />
            <div style={{ height: '65vh', overflow: 'auto' }}>
              <CTable>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ minWidth: '60px' }} scope="col">Id</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: '160px' }} scope="col">Username</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: '160px' }} scope="col">Full Name</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: '160px' }} scope="col">Phone</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: '180px' }} scope="col">Email</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: '200px' }} scope="col">Address</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: '160px' }} scope="col">Birthday</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: '160px' }} scope="col">Stall</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: '100px' }} scope="col">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredData.filter(row => row.status && row.roleId === 2).map((row) => (
                    <CTableRow key={row.id}>
                      <CTableHeaderCell scope="row">{row.id}</CTableHeaderCell>
                      <CTableDataCell>{row.username}</CTableDataCell>
                      <CTableDataCell>{row.fullName}</CTableDataCell>
                      <CTableDataCell>{row.phone}</CTableDataCell>
                      <CTableDataCell>{row.email}</CTableDataCell>
                      <CTableDataCell>{row.address}</CTableDataCell>
                      <CTableDataCell>{row.birthday}</CTableDataCell>
                      <CTableDataCell>{row.stallName}</CTableDataCell>
                      <CTableDataCell>
                        <CDropdown className="position-relative">
                          <CDropdownToggle color="light" className="border-0 bg-transparent p-0 custom-dropdown-toggle">
                            <CIcon icon={cilHamburgerMenu} size="xl" />
                          </CDropdownToggle>
                          <CDropdownMenu>
                            <CDropdownItem onClick={() => handleEdit(row.id)}>Update</CDropdownItem>
                            <CDropdownItem onClick={() => {
                              setDeleteId(row.id);
                              setVisible(true);
                              setDeletedUsername(row.username);
                            }}>Delete</CDropdownItem>
                          </CDropdownMenu>
                        </CDropdown>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
            <CButton className='custom-btn custom-btn-success mt-1' color="success" onClick={handleAddNew}>
              Add New Staff
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <CModal
        visible={visible}
        onClose={() => setVisible(false)}
        aria-labelledby="DeleteConfirmationModalLabel"
      >
        {deletedUsername !== userInfo.username ? <>
          <CModalHeader>
            <CModalTitle id="DeleteConfirmationModalLabel">Confirm Deletion</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p>Are you sure you want to delete this account?</p>
          </CModalBody>
          <CModalFooter>
            <CButton className='custom-btn custom-btn-secondary' color="secondary" onClick={() => setVisible(false)}>
              Cancel
            </CButton>
            <CButton className='custom-btn custom-btn-danger' color="danger" onClick={e => handleDelete(deleteId)}>
              Delete
            </CButton>
          </CModalFooter>
        </> : <>
          <CModalHeader>
            <CModalTitle id="DeleteConfirmationModalLabel">Delete Error</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p>You are signed in. Cannot delete</p>
          </CModalBody>
          <CModalFooter>
            <CButton className='custom-btn custom-btn-secondary' color="secondary" onClick={() => setVisible(false)}>
              Cancel
            </CButton>
          </CModalFooter>
        </>}
      </CModal>

      <CModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        aria-labelledby="ErrorModalLabel"
      >
        <CModalHeader>
          <CModalTitle id="ErrorModalLabel">Input information error</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>{errorMessage}</p>
        </CModalBody>
        <CModalFooter>
          <CButton className='custom-btn custom-btn-secondary' color="secondary" onClick={() => setErrorModalVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={editModalVisible}
        onClose={handleCancelEdit}
        aria-labelledby="EditModalLabel"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle id="EditModalLabel">{isNew ? "Add Staff" : "Edit Staff"}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            type="text"
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleInputChange}
            className="mb-3"
          />
          <CFormInput
            type="text"
            name="fullName"
            label="Full Name"
            value={formData.fullName}
            onChange={handleInputChange}
            className="mb-3"
          />
          {isNew && (
            <CFormInput
              type="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="mb-3"
            />
          )}
          <CFormInput
            type="text"
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="mb-3"
          />
          <CFormTextarea
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleInputChange}
            className="mb-3"
          />
          <CFormTextarea
            name="address"
            label="Address"
            value={formData.address}
            onChange={handleInputChange}
            className="mb-3"
          />
          <CFormInput
            type="date"
            name="birthday"
            label="Birthday"
            value={formData.birthday}
            onChange={handleInputChange}
            className="mb-3"
          />
          <CFormSelect
            name="stallId"
            label="Stall"
            value={formData.stallId !== null ? formData.stallId : "null"}
            onChange={handleInputChange}
            className="mb-3"
          >
            <option value="">Select Stall</option>
            <option value="null">N/A</option>
            {stalls.map(stall => (
              <option key={stall.id} value={stall.id}>{stall.name}</option>
            ))}
          </CFormSelect>
        </CModalBody>
        <CModalFooter>
          <CButton className='custom-btn custom-btn-secondary' color="secondary" onClick={handleCancelEdit}>
            Cancel
          </CButton>
          <CButton className='custom-btn custom-btn-success' color="success" onClick={handleSave}>
            Save
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={confirmationModalVisible}
        onClose={() => setConfirmationModalVisible(false)}
        aria-labelledby="ConfirmationModalLabel"
      >
        <CModalHeader>
          <CModalTitle id="ConfirmationModalLabel">Account Information</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Your account has been created successfully!</p>
          <p><strong>Username:</strong> {confirmationInfo.username}</p>
          <p><strong>Password:</strong> {confirmationInfo.password}</p>
        </CModalBody>
        <CModalFooter>
          <CButton className='custom-btn custom-btn-secondary' color="secondary" onClick={() => setConfirmationModalVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        aria-labelledby="SuccessModalLabel"
      >
        <CModalHeader>
          <CModalTitle id="SuccessModalLabel">Success</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Your changes have been saved successfully!</p>
        </CModalBody>
        <CModalFooter>
          <CButton className='custom-btn custom-btn-secondary' color="secondary" onClick={() => setSuccessModalVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={deleteSuccessModalVisible}
        onClose={() => setDeleteSuccessModalVisible(false)}
        aria-labelledby="DeleteSuccessModalLabel"
      >
        <CModalHeader>
          <CModalTitle id="DeleteSuccessModalLabel">Delete Successful</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>The account has been deleted successfully!</p>
        </CModalBody>
        <CModalFooter>
          <CButton className='custom-btn custom-btn-secondary' color="secondary" onClick={() => setDeleteSuccessModalVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  );
};

export default StaffList;
