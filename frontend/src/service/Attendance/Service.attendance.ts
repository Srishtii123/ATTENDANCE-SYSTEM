import { dispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { IApiResponse } from 'types/types.services';
import axiosServices from 'utils/axios';
import { IAttendanceRecord, IAttendanceStats } from '../../types/attendance.types';

class AttendanceService {
  getDailyStats = async () => {
    try {
      const response = await axiosServices.get('api/attendance/dashboard/daily');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch daily stats');
    } catch (error: any) {
      throw error;
    }
  };

  getDepartmentStats = async (startDate?: string, endDate?: string) => {
    try {
      const response = await axiosServices.get('api/attendance/dashboard/departments', {
        params: { startDate, endDate }
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch department stats');
    } catch (error: any) {
      throw error;
    }
  };

  getMonthlyStats = async () => {
    try {
      const response = await axiosServices.get('api/attendance/dashboard/monthly');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch monthly stats');
    } catch (error: any) {
      throw error;
    }
  };

  getLateArrivalTrends = async (days = 30) => {
    try {
      const response = await axiosServices.get('api/attendance/dashboard/trends/late', {
        params: { days }
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch late arrival trends');
    } catch (error: any) {
      throw error;
    }
  };

  getEmployeeHistory = async (employeeId: string, days = 30) => {
    try {
      const response = await axiosServices.get(`api/attendance/dashboard/employee/${employeeId}/history`, {
        params: { days }
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch employee history');
    } catch (error: any) {
      throw error;
    }
  };
  getAttendanceRecords = async (
    paginationData?: { page: number; rowsPerPage: number },
    dateRange?: [string, string]
  ): Promise<{ data: IAttendanceRecord[]; total: number; page: number; limit: number }> => {
    try {
      const response = await axiosServices.get('api/attendance/report', {
        params: {
          ...(paginationData?.page !== undefined && { page: paginationData.page + 1 }),
          ...(paginationData?.rowsPerPage && { limit: paginationData.rowsPerPage }),
          ...(dateRange && {
            from_date: dateRange[0],
            to_date: dateRange[1]
          })
        }
      });

      // Directly return the response data if it matches the expected structure
      if (response.status === 200 && response.data && response.data.data) {
        return response.data; // Return the entire response data
      }
      throw new Error('Unexpected response structure');
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Failed to fetch attendance records',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  /**
   * Get ALL attendance records for a date range (entire month/period)
   * No pagination - returns all records even if 2000+
   */
  getFullMonthAttendanceRecords = async (
    dateRange: [string, string],
    department?: string
  ): Promise<{ data: IAttendanceRecord[]; total: number; success: boolean }> => {
    try {
      const response = await axiosServices.get('api/attendance/report/full-month', {
        params: {
          from_date: dateRange[0],
          to_date: dateRange[1],
          ...(department && { department })
        }
      });

      if (response.status === 200 && response.data && response.data.data) {
        return response.data;
      }
      throw new Error('Unexpected response structure');
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Failed to fetch full month attendance records',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  // markAttendance = async (data: FormData) => {
  //   try {
  //     const response = await axiosServices.post('api/attendance/mark', data);

  //     // Return the full API response
  //     if (response.data && response.data.success) {
  //       dispatch(
  //         openSnackbar({
  //           open: true,
  //           message: `${data.get('action') === 'check-in' ? 'Check In' : 'Check Out'} successful`,
  //           variant: 'alert',
  //           alert: { color: 'success' },
  //           close: true
  //         })
  //       );
  //       return response.data; // Return the full response data
  //     } else {
  //       const errorMessage = response.data?.error || 'Attendance marking failed';
  //       throw new Error(errorMessage);
  //     }
  //   } catch (error: unknown) {
  //     const axiosError = error as any;
  //     const errorMessage =
  //       axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || 'Failed to mark attendance';

  //     dispatch(
  //       openSnackbar({
  //         open: true,
  //         message: errorMessage,
  //         variant: 'alert',
  //         alert: { color: 'error' },
  //         severity: 'error',
  //         close: true
  //       })
  //     );
  //     throw new Error(errorMessage); // Throw the error to be handled by the caller
  //   }
  // };
  markAttendance = async (data: FormData) => {
    try {
      const response = await axiosServices.post('api/attendance/mark', data);

      // Handle auto-confirm response
      if (response.data && response.data.success) {
        if (response.data.requires_confirmation) {
          // Show different message for pending confirmation
          dispatch(
            openSnackbar({
              open: true,
              message: `Face recognized! Please confirm your identity`,
              variant: 'alert',
              alert: { color: 'info' },
              close: true
            })
          );
        } else {
          // Direct success
          dispatch(
            openSnackbar({
              open: true,
              message: `${data.get('action') === 'check-in' ? 'Check In' : 'Check Out'} successful`,
              variant: 'alert',
              alert: { color: 'success' },
              close: true
            })
          );
        }
        return response.data;
      } else {
        const errorMessage = response.data?.error || 'Attendance marking failed';
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const axiosError = error as any;
      const errorMessage =
        axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || 'Failed to mark attendance';
      const wrappedError = new Error(errorMessage) as Error & {
        requiresManualRequest?: boolean;
        confidence?: number;
        confidenceBand?: string;
      };
      wrappedError.requiresManualRequest = !!axiosError.response?.data?.requires_manual_request;
      wrappedError.confidence = axiosError.response?.data?.confidence;
      wrappedError.confidenceBand = axiosError.response?.data?.confidenceBand;
      const shouldRouteToManual =
        wrappedError.requiresManualRequest ||
        axiosError.response?.status === 404 ||
        errorMessage.toLowerCase().includes('not recognized') ||
        errorMessage.toLowerCase().includes('not found');

      dispatch(
        openSnackbar({
          open: true,
          message: shouldRouteToManual ? 'Face not matched. Manual request is available.' : errorMessage,
          variant: 'alert',
          alert: { color: shouldRouteToManual ? 'warning' : 'error' },
          severity: shouldRouteToManual ? 'warning' : 'error',
          close: true
        })
      );
      throw wrappedError;
    }
  };

  getAttendanceStats = async (): Promise<IAttendanceStats> => {
    try {
      const response: IApiResponse<IAttendanceStats> = await axiosServices.get('api/attendance/stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch attendance stats');
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  getPerformanceSummary = async () => {
    try {
      const response = await axiosServices.get('api/attendance/performance/summary');
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to fetch performance summary');
    } catch (error: unknown) {
      const knownError = error as { message?: string; response?: any };
      throw new Error(knownError.response?.data?.message || knownError.message || 'Failed to fetch performance summary');
    }
  };

  registerEmployee = async (formData: FormData) => {
    try {
      console.log('🟡 Starting employee registration...');
      const response = await axiosServices.post('api/attendance/employees', formData);

      dispatch(
        openSnackbar({
          open: true,
          message: 'Employee registered successfully',
          variant: 'alert',
          alert: { color: 'success' },
          close: true
        })
      );
      return response.data;
    } catch (error: any) {
      console.log('=== COMPREHENSIVE ERROR DEBUGGING ===');

      // Log the complete error structure
      console.log('1. Complete error object:', error);
      console.log('2. Error keys:', Object.keys(error));

      // Check if it's an Axios error
      console.log('3. Is Axios error?', error.isAxiosError);
      console.log('4. Error config:', error.config);

      // Check the response property
      console.log('5. Error response exists?', !!error.response);
      console.log('6. Error response:', error.response);

      if (error.response) {
        console.log('7. Response status:', error.response.status);
        console.log('8. Response status text:', error.response.statusText);
        console.log('9. Response headers:', error.response.headers);
        console.log('10. Response data exists?', !!error.response.data);
        console.log('11. Response data:', error.response.data);
        console.log('12. Response data type:', typeof error.response.data);

        if (error.response.data) {
          console.log('13. Response data keys:', Object.keys(error.response.data));
          console.log('14. Response data.error:', error.response.data.error);
          console.log('15. Response data.message:', error.response.data.message);
          console.log('16. Response data.success:', error.response.data.success);
        }
      }

      // Check request property
      console.log('17. Error request exists?', !!error.request);
      console.log('18. Error request:', error.request);

      // Check other error properties
      console.log('19. Error message:', error.message);
      console.log('20. Error code:', error.code);

      // Extract message using different methods
      let displayMessage = 'Unknown error';

      // Method 1: Direct access
      if (error.response?.data?.error) {
        displayMessage = error.response.data.error;
        console.log('✅ Method 1 - Direct access:', displayMessage);
      }
      // Method 2: Try message field
      else if (error.response?.data?.message) {
        displayMessage = error.response.data.message;
        console.log('✅ Method 2 - Message field:', displayMessage);
      }
      // Method 3: Stringify the entire data
      else if (error.response?.data) {
        displayMessage = JSON.stringify(error.response.data);
        console.log('✅ Method 3 - Stringify data:', displayMessage);
      }
      // Method 4: Use status text
      else if (error.response?.statusText) {
        displayMessage = error.response.statusText;
        console.log('✅ Method 4 - Status text:', displayMessage);
      }
      // Method 5: Use basic error message
      else if (error.message) {
        displayMessage = error.message;
        console.log('✅ Method 5 - Error message:', displayMessage);
      }

      console.log('🎯 FINAL DISPLAY MESSAGE:', displayMessage);
      console.log('=== END DEBUGGING ===');

      dispatch(
        openSnackbar({
          open: true,
          message: displayMessage,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );

      throw error;
    }
  };
  getEmployees = async () => {
    try {
      const response = await axiosServices.get('api/attendance/employees');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error('Unexpected API response format');
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  /**
   * Create an attendance request (multipart form data expected)
   */
  createAttendanceRequest = async (formData: FormData) => {
    try {
      const response = await axiosServices.post('api/attendance/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Attendance request submitted',
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          })
        );
        return response.data;
      }

      const errorMessage = response.data?.error || 'Failed to submit attendance request';
      throw new Error(errorMessage);
    } catch (error: any) {
      const messageText = error.response?.data?.message || error.message || 'Failed to submit attendance request';
      dispatch(
        openSnackbar({
          open: true,
          message: messageText,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
      throw error;
    }
  };

  /**
   * List attendance requests (admin view)
   */
  listAttendanceRequests = async () => {
    try {
      const response = await axiosServices.get('api/attendance/requests');
      console.log('Raw response from listAttendanceRequests:', response);
      console.log('API data:', response.data);
      if (response.status === 200 && response.data) {
        return response.data.data;
      }
      throw new Error('Unexpected response while fetching attendance requests');
    } catch (error: any) {
      const msg = error.message || 'Failed to fetch attendance requests';
      dispatch(
        openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
      throw error;
    }
  };

  /**
   * Approve an attendance request (creates attendance event on backend)
   */
  approveAttendanceRequest = async (id: number, notes?: string) => {
    try {
      const response = await axiosServices.post(`api/attendance/request/${id}/approve`, { notes });
      if (response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Attendance request approved',
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          })
        );
        return response.data;
      }
      const errorMessage = response.data?.error || 'Failed to approve attendance request';
      throw new Error(errorMessage);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to approve attendance request';
      dispatch(
        openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
      throw error;
    }
  };

  // Reject attendance request
  rejectAttendanceRequest = async (id: number, notes?: string) => {
    try {
      const response = await axiosServices.post(`api/attendance/request/${id}/reject`, { notes });
      if (response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Attendance request rejected',
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          })
        );
        return response.data;
      }
      const errorMessage = response.data?.error || 'Failed to reject attendance request';
      throw new Error(errorMessage);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to reject attendance request';
      dispatch(
        openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
      throw error;
    }
  };

  getEmployeeInfo = async (employee_code?: string, name?: string) => {
    try {
      if (!employee_code && !name) {
        throw new Error('Either employee_code or name parameter is required');
      }

      const response = await axiosServices.get('api/attendance/employeeinfo', {
        params: { employee_code, name }
      });

      if (response.data && typeof response.data === 'object') {
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        return response.data;
      }

      if (response.status === 200) {
        return response.data;
      }

      throw new Error(response.data?.message || 'Failed to fetch employee info');
    } catch (error: unknown) {
      const knownError = error as { message?: string; response?: any };
      const errorMessage =
        knownError.response?.data?.error || knownError.response?.data?.message || knownError.message || 'Failed to fetch employee info';

      dispatch(
        openSnackbar({
          open: true,
          message: errorMessage,
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );

      throw error;
    }
  };

  getEmployeeInfobt = async (employee_code?: string, name?: string) => {
    try {
      if (!employee_code && !name) {
        throw new Error('Either employee_code or name parameter is required');
      }

      const response = await axiosServices.get('api/attendance/employeeinfo/bayanatdb', {
        params: { employee_code, name }
      });

      // If backend follows { success, data } pattern
      if (response.data && typeof response.data === 'object') {
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        // backend might return raw employee object directly
        return response.data;
      }

      if (response.status === 200) {
        return response.data;
      }

      throw new Error(response.data?.message || 'Failed to fetch employee info');
    } catch (error: unknown) {
      const knownError = error as { message?: string; response?: any };
      const errorMessage =
        knownError.response?.data?.error || knownError.response?.data?.message || knownError.message || 'Failed to fetch employee info';

      dispatch(
        openSnackbar({
          open: true,
          message: errorMessage,
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );

      throw error;
    }
  };

  modifyEmployee = async (employeeId: string, formData: FormData) => {
    try {
      const response: IApiResponse<{ employeeId: string }> = await axiosServices.put(`api/attendance/employees/${employeeId}`, formData);

      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Employee information updated successfully',
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          })
        );
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update employee information');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update employee information';

      dispatch(
        openSnackbar({
          open: true,
          message: errorMessage,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
      throw new Error(errorMessage);
    }
  };

  getCurrentEmployee = async () => {
    try {
      const response = await axiosServices.get('api/attendance/current-employee');
      // Accept either { success, data } or raw object
      if (response.data && typeof response.data === 'object') {
        if (response.data.success && response.data.data) return response.data.data;
        return response.data;
      }
      if (response.status === 200) return response.data;
      return null;
    } catch (error: any) {
      console.warn('getCurrentEmployee failed', error);
      return null;
    }
  };

  confirmAttendance = async (payload: { uuid: string; confirmed_by?: string }) => {
    try {
      const response = await axiosServices.post('api/attendance/confirm', payload);

      if (response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Attendance confirmed successfully!',
            variant: 'alert',
            alert: { color: 'success' },
            close: true,
            duration: 1000
          })
        );
        return response.data;
      } else {
        const errorMessage = response.data?.message || 'Confirmation failed';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to confirm attendance';

      dispatch(
        openSnackbar({
          open: true,
          message: errorMessage,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
      throw new Error(errorMessage);
    }
  };

  cancelAttendance = async (payload: { uuid: string; actual_employee_code: string; actual_employee_name: string; reason?: string }) => {
    try {
      const response = await axiosServices.post('api/attendance/cancel', {
        ...payload,
        reason: payload.reason || 'proxy_detected'
      });

      if (response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Proxy attempt reported! HR has been notified.',
            variant: 'alert',
            alert: { color: 'warning' },
            close: true
          })
        );
        return response.data;
      } else {
        const errorMessage = response.data?.message || 'Cancellation failed';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel attendance';

      dispatch(
        openSnackbar({
          open: true,
          message: errorMessage,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
      throw new Error(errorMessage);
    }
  };

  getProxyLogs = async (filters?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    employee_code?: string;
    action?: 'check_in' | 'check_out' | '';
    status?: string;
  }) => {
    try {
      const response = await axiosServices.get('api/attendance/proxy-logs', {
        params: filters
      });

      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch proxy logs');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch proxy logs';

      dispatch(
        openSnackbar({
          open: true,
          message: errorMessage,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
      throw new Error(errorMessage);
    }
  };

  async stopAutoConfirm(uuid: string) {
    try {
      const response = await axiosServices.post('api/attendance/stop-auto-confirm', { uuid });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to stop auto-confirm');
    }
  }
}

const attendanceServiceInstance = new AttendanceService();
export default attendanceServiceInstance;
