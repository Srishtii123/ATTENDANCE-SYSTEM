import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button } from '@mui/material';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import moment from 'moment';
import UniversalDialog from 'components/popup/UniversalDialog';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';
import EmployeeRegistration from './EmployeeRegistration';
import {
  attendanceGridPanel,
  attendanceGridTheme,
  attendanceHeaderCard,
  attendanceIconBox,
  attendancePageBackdrop,
  attendanceShell,
  attendanceShellInner,
  attendanceSubtitle,
  attendanceTitle
} from '../attendanceStyles';

const EmployeeListing = () => {
  const gridRef = useRef<any>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [employeeFormPopup, setEmployeeFormPopup] = useState({
    open: false,
    isEditMode: false,
    existingData: null
  });

  const { data: employees, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: attendanceServiceInstance.getEmployees
  });

  const toggleEmployeeFormPopup = useCallback((existingData = null) => {
    setEmployeeFormPopup((prev) => ({
      ...prev,
      open: !prev.open,
      isEditMode: !!existingData,
      existingData
    }));
  }, []);

  const handleActions = (actionType: string, rowData: any) => {
    if (actionType === 'edit') {
      toggleEmployeeFormPopup(rowData);
    }
  };

  const containerStyle = useMemo(
    () => ({
      height: windowWidth < 768 ? '450px' : '100%',
      width: '100%',
      minHeight: windowWidth < 768 ? '350px' : 0
    }),
    [windowWidth]
  );

  const columnDefs = [
    {
      headerName: 'Employee Code',
      field: 'employee_code',
      width: 140,
      minWidth: 100,
      cellStyle: { fontFamily: 'monospace', color: '#1677ff', fontSize: '11px' },
      suppressSizeToFit: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: false,
        debounceMs: 300
      }
    },
    {
      headerName: 'Employee ID',
      field: 'employee_id',
      width: 110,
      minWidth: 90,
      suppressSizeToFit: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: false,
        debounceMs: 300
      }
    },
    {
      headerName: 'Full Name',
      field: 'full_name',
      sortable: true,
      filter: true,
      minWidth: 180,
      flex: 2
    },
    {
      headerName: 'Email',
      field: 'email',
      sortable: true,
      filter: true,
      minWidth: 260,
      flex: 2,
      hide: windowWidth < 768
    },
    {
      headerName: 'Position',
      field: 'position',
      sortable: true,
      filter: true,
      minWidth: 130,
      flex: 1
    },
    {
      headerName: 'Hire Date',
      field: 'hire_date',
      sortable: true,
      filter: true,
      minWidth: 120,
      flex: 1
    },
    {
      headerName: 'Phone Number',
      field: 'phone_number',
      sortable: true,
      filter: true,
      minWidth: 130,
      flex: 1,
      hide: windowWidth < 768
    },
    {
      headerName: 'Created At',
      field: 'created_at',
      sortable: true,
      filter: true,
      valueFormatter: (params: { value: string }) => (params.value ? moment.utc(params.value).local().format('YYYY-MM-DD HH:mm:ss') : '')
    },
    {
      headerName: 'Actions',
      field: 'actions',
      filter: false,
      cellRenderer: (params: { data: any }) => {
        const actionButtons: TAvailableActionButtons[] = ['edit'];
        return <ActionButtonsGroup handleActions={(action) => handleActions(action, params.data)} buttons={actionButtons} />;
      }
    }
  ];

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: false,
      suppressMenu: false,
      menuTabs: ['filterMenuTab'],
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: false,
        debounceMs: 300
      }
    }),
    []
  );

  const gridOptions = useMemo<GridOptions>(
    () => ({
      rowHeight: windowWidth < 768 ? 40 : 25,
      headerHeight: windowWidth < 768 ? 35 : 30,
      enableCellTextSelection: true,
      enableBrowserTooltips: true,
      suppressMenuHide: false,
      pagination: true,
      paginationPageSizeSelector: [50, 100, 500, 1000],
      paginationPageSize: windowWidth < 768 ? 15 : 25,
      animateRows: true,
      popupParent: document.body
    }),
    [windowWidth]
  );

  const onGridReady = (params: any) => {
    gridRef.current = params.api;
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 100);
  };

  const onGridSizeChanged = (params: any) => {
    params.api.sizeColumnsToFit();
  };

  return (
    <div className={attendanceShell}>
      <div className={attendancePageBackdrop} />
      <div className={attendanceShellInner}>
      <section className={attendanceHeaderCard}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className={attendanceIconBox}>
            <TeamOutlined />
          </div>
          <div>
            <h1 className={attendanceTitle}>Employees</h1>
            <p className={attendanceSubtitle}>Manage profiles and enrolled face data.</p>
          </div>
        </div>
        <Button
          startIcon={<PlusOutlined />}
          color="primary"
          variant="contained"
          onClick={() => toggleEmployeeFormPopup()}
          style={{ borderRadius: '8px', padding: '7px 14px', backgroundColor: '#082a89' }}
        >
          Register Employee
        </Button>
      </div>
      </section>

      <section className={attendanceGridPanel}>
        <style>
          {attendanceGridTheme(windowWidth)}
        </style>

        <div className="ag-theme-alpine" style={containerStyle}>
          <AgGridReact
            ref={gridRef}
            rowData={Array.isArray(employees) ? employees : []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            gridOptions={gridOptions}
            onGridReady={onGridReady}
            onGridSizeChanged={onGridSizeChanged}
            onFirstDataRendered={onGridSizeChanged}
            suppressScrollOnNewData={true}
            enableBrowserTooltips={true}
          />
        </div>
      </section>

      {employeeFormPopup.open && (
        <UniversalDialog
          action={{ open: employeeFormPopup.open, fullWidth: true, maxWidth: windowWidth < 640 ? false : 'lg', fullScreen: windowWidth < 640 }}
          onClose={toggleEmployeeFormPopup}
          title="Register Employee"
          hasPrimaryButton={false}
        >
          <EmployeeRegistration
            onClose={toggleEmployeeFormPopup}
            onRegisterSuccess={refetch}
            existingData={employeeFormPopup.existingData}
          />
        </UniversalDialog>
      )}
      </div>
    </div>
  );
};

export default EmployeeListing;
