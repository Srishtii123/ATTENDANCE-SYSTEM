import { ColDef } from 'ag-grid-community';
import ActionButtonsGroup from '../../components/buttons/ActionButtonsGroup';
import CustomAgGrid from '../../components/grid/CustomAgGrid';
      import { useState, useEffect, useMemo } from 'react';
import { TAvailableActionButtons } from '../../types/types.actionButtonsGroups';
import axiosServices from '../../utils/axios';
import { TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const RegisterPage = () => {
  const [employees, setEmployees] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Employee Id',
        field: 'EMPLOYEE_ID',
        sortable: true,
        filter: true
      },
      // {
      //   headerName: 'Full Name',
      //   field: 'FULL_NAME',
      //   sortable: true,
      //   filter: true
      // },
      {
  headerName: 'Full Name',
  field: 'FULL_NAME',
  sortable: true,
  filter: true,
  cellRenderer: (p: { value: string }) => (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[#082a89]">
        {p.value?.charAt(0)?.toUpperCase()}
      </span>
      <span className="font-medium text-slate-800">{p.value}</span>
    </div>
  )
},
      {
        headerName: 'Email',
        field: 'EMAIL',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Department',
        field: 'DEPARTMENT',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Position',
        field: 'POSITION',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Hire Date',
        field: 'HIRE_DATE',
        sortable: true,
        filter: true,
         valueFormatter: (p: any) => (p.value ? dayjs(p.value).format('DD MMM YYYY') : '-')
      },
      {
        headerName: 'Phone Number',
        field: 'PHONE_NUMBER',
        sortable: true,
        filter: true
      },
      // {
      //   headerName: 'Employee Code',
      //   field: 'EMPLOYEE_CODE',
      //   sortable: true,
      //   filter: true
      // },
      {
        headerName: 'Actions',
        width: 110,
  flex: 0,
  pinned: 'right',
  sortable: false,
  filter: false,
  resizable: false,
        cellRenderer: (params: { data: any }) => {
          const actionButtons: TAvailableActionButtons[] = ['edit', 'delete'];
          function handleActions(action: any, data: any): void {
            throw new Error('Function not implemented.');
          }

          return <ActionButtonsGroup handleActions={(action: any) => handleActions(action, params.data)} buttons={actionButtons} />;
        }
      }
    ],
    []
  );

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await axiosServices.get('/api/attendance/employees');
        setEmployees(response.data);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch employees');
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // if (loading) return <div>Loading employees...</div>;
  // if (error) return <div>Error: {error}</div>;

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">Loading employees...</div>;
if (error) return <div className="m-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>;

  console.log("employees1", employees.data?.[0].FULL_NAME)
  console.log("employees", employees)

  function onGridReady(params: any): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div>
      {/* <h2>Employees List</h2>
            <h2>{employees?.data?.[0].FULL_NAME} | {employees?.data?.[0].DEPARTMENT}</h2>
            <h2>{employees?.data?.[1].FULL_NAME} | {employees?.data?.[0].DEPARTMENT}</h2> */}

      <CustomAgGrid
        rowData={employees?.data || []}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        // onFilterChanged={onFilterChanged}
        // onPaginationChanged={onPaginationChanged}
        // onSortChanged={onSortChanged}
        paginationPageSizeSelector={[10, 50, 100, 500, 1000]}
        paginationPageSize={1000}
        pagination={true}
        height="calc(100vh - 120px)"
      />

    </div>
  );
};

export default RegisterPage;
