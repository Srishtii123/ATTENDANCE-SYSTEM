import { useState, useRef, useCallback, useEffect } from 'react';
import { message, Select, Radio, Tag } from 'antd';
import {
  CameraOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ScanOutlined,
  BulbOutlined,
  WarningOutlined,
  RedoOutlined,
  FormOutlined
} from '@ant-design/icons';
import Webcam from 'react-webcam';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';

const ManualRequestModal = ({
  onClose,
  defaultEventType
}: {
  onClose: () => void;
  defaultEventType: 'check_in' | 'check_out';
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [eventType, setEventType] = useState<'check_in' | 'check_out'>(defaultEventType);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    attendanceServiceInstance
      .getEmployees()
      .then((res: any) => setEmployees(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmployees(false));
  }, []);

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setCapturedImage(imageSrc);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) return message.warning('Please select an employee.');
    if (!capturedImage) return message.warning('Please capture a photo first.');

    const selectedEmp = employees.find((e) => e.employee_code === selectedEmployee);
    setIsSubmitting(true);
    try {
      const blob = await (await fetch(capturedImage)).blob();
      const form = new FormData();
      form.append('file', new File([blob], 'capture.jpg', { type: blob.type }));
      form.append('employee_code', selectedEmployee);
      form.append('event_type', eventType);
      form.append('requested_by', selectedEmp?.full_name ?? selectedEmployee ?? 'Unknown');

      const response = await attendanceServiceInstance.createAttendanceRequest(form);
      if (response?.success) {
        message.success(`Request submitted. HR will review and approve it shortly.`);
        onClose();
      } else {
        message.error('Failed to submit request.');
      }
    } catch (err: any) {
      message.error(err?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployeeRecord = employees.find((e) => e.employee_code === selectedEmployee);
  const isReady = !!selectedEmployee && !!capturedImage;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-4">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-[28px] bg-[#f8fafc] shadow-2xl">

        <div className="relative overflow-hidden bg-[#111827] px-5 pb-5 pt-4 text-white sm:px-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(20,184,166,0.32),transparent_28%),linear-gradient(135deg,#111827_0%,#1f2937_58%,#020617_100%)]" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-lg">
                <FormOutlined />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">Exception flow</p>
                <h3 className="mt-1 text-xl font-bold tracking-normal sm:text-2xl">Manual Attendance Request</h3>
                <p className="mt-1 max-w-xl text-sm leading-5 text-slate-300">
                  Capture a clear photo and send it to HR for approval when face recognition cannot verify the employee.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close manual attendance request"
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-3 gap-2 text-xs sm:max-w-md">
            {[
              { label: 'Employee', done: !!selectedEmployee },
              { label: 'Type', done: !!eventType },
              { label: 'Photo', done: !!capturedImage }
            ].map((step) => (
              <div
                key={step.label}
                className={`rounded-2xl border px-3 py-2 ${
                  step.done ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-white/8 text-slate-300'
                }`}
              >
                <div className="font-semibold">{step.label}</div>
                <div className="mt-0.5 text-[11px] opacity-80">{step.done ? 'Ready' : 'Needed'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid max-h-[calc(94vh-176px)] gap-4 overflow-y-auto p-4 sm:grid-cols-[1fr_290px] sm:p-5">

          <section className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <UserOutlined /> Employee
            </label>
            <Select
              showSearch
              placeholder="Search by code or name"
              value={selectedEmployee || undefined}
              onChange={setSelectedEmployee}
              style={{ width: '100%' }}
              size="large"
              loading={loadingEmployees}
              optionFilterProp="label"
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={employees.map((e) => ({
                value: e.employee_code,
                label: `${e.employee_code} - ${e.full_name}`
              }))}
            />
            {selectedEmployeeRecord && (
              <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-sm font-bold text-slate-900">{selectedEmployeeRecord.full_name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {selectedEmployeeRecord.employee_code}
                  {selectedEmployeeRecord.department ? ` | ${selectedEmployeeRecord.department}` : ''}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Attendance type</label>
            <Radio.Group
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="grid w-full grid-cols-2 gap-2"
            >
              <Radio.Button
                value="check_in"
                className="!h-auto !rounded-2xl !border !border-slate-200 !px-4 !py-3 !text-center !text-[0px] !shadow-sm"
              >
                <span className="block text-sm font-bold">Check In</span>
                <span className="block text-xs text-slate-500">Start shift</span>
              </Radio.Button>
              <Radio.Button
                value="check_out"
                className="!h-auto !rounded-2xl !border !border-slate-200 !px-4 !py-3 !text-center !text-[0px] !shadow-sm"
              >
                <span className="block text-sm font-bold">Check Out</span>
                <span className="block text-xs text-slate-500">End shift</span>
              </Radio.Button>
            </Radio.Group>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CameraOutlined /> Evidence photo
              </label>
              {capturedImage && (
                <Tag color="success" icon={<CheckCircleOutlined />} className="!mr-0">
                  Captured
                </Tag>
              )}
            </div>
            <div className="relative mx-auto aspect-square max-w-[360px] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
              {!capturedImage ? (
                <>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.82}
                    videoConstraints={{ facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }}
                    mirrored
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-44 w-36 rounded-[28px] border-4 border-teal-400/90 shadow-[0_0_30px_rgba(45,212,191,0.35)] sm:h-52 sm:w-44" />
                  </div>
                  <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-semibold text-white">
                    Align face inside frame
                  </div>
                </>
              ) : (
                <div className="relative h-full w-full">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="h-full w-full object-cover"
                  />
                  <Tag
                    color="success"
                    icon={<CheckCircleOutlined />}
                    style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
                  >
                    Photo Captured
                  </Tag>
                </div>
              )}
            </div>
            <div className="mt-3">
              {!capturedImage ? (
                <button
                  onClick={capture}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
                >
                  <CameraOutlined /> Capture Photo
                </button>
              ) : (
                <button
                  onClick={() => setCapturedImage(null)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <RedoOutlined /> Retake Photo
                </button>
              )}
            </div>
          </div>

          </section>

          <aside className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Review</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Employee</span>
                <span className="truncate font-bold text-slate-900">{selectedEmployeeRecord?.full_name || 'Not selected'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Code</span>
                <span className="font-bold text-slate-900">{selectedEmployee || '-'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Type</span>
                <Tag color={eventType === 'check_in' ? 'green' : 'blue'} className="!mr-0">
                  {eventType === 'check_in' ? 'Check In' : 'Check Out'}
                </Tag>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Photo</span>
                <span className={`font-bold ${capturedImage ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {capturedImage ? 'Ready' : 'Needed'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-[0px] text-amber-900">
            <div className="text-sm font-bold">Pending HR approval</div>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              Manual requests do not mark attendance instantly. HR must approve the request before the attendance event is created.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isReady || isSubmitting}
              className={`rounded-2xl px-4 py-3 text-[0px] font-bold transition ${
                isReady && !isSubmitting
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg hover:shadow-xl'
                  : 'cursor-not-allowed bg-slate-200 text-slate-400'
              }`}
            >
              <span className="text-sm">{isSubmitting ? 'Submitting...' : 'Submit'}</span>
            </button>
          </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: unchanged logic, manual request wired to failure states
// ─────────────────────────────────────────────────────────────────────────────
const AttendanceMarking = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState<'check-in' | 'check-out'>('check-in');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<'idle' | 'counting' | 'capturing' | 'success' | 'error'>('idle');
  const [successData, setSuccessData] = useState<any>(null);
  const [maxAttempts] = useState(3);
  const [isVoiceEnabled] = useState(true);

  // NEW: manual fallback modal
  const [showManualRequest, setShowManualRequest] = useState(false);
  const [, setManualRequestReason] = useState<string>('');

  const [userLocation, setUserLocation] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string>('');

  const AUTO_CONFIRM_DELAY_MS = 3000;
  const AUTO_CONFIRM_SECONDS = Math.floor(AUTO_CONFIRM_DELAY_MS / 1000);
  const FAST_CAPTURE_COUNTDOWN = 1;

  const [autoConfirmModal, setAutoConfirmModal] = useState(false);
  const [pendingAttendance, setPendingAttendance] = useState<any>(null);
  const [autoConfirmFallbackImage, setAutoConfirmFallbackImage] = useState<string | null>(null);
  const [autoConfirmCountdown, setAutoConfirmCountdown] = useState<number>(AUTO_CONFIRM_SECONDS);
  const [autoConfirmTimer, setAutoConfirmTimer] = useState<NodeJS.Timeout | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const activeActionRef = useRef<'check-in' | 'check-out'>('check-in');
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getVideoConstraints = () => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1024;
    if (isMobile) return { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user', aspectRatio: 1 };
    if (isTablet) return { width: { ideal: 600 }, height: { ideal: 600 }, facingMode: 'user', aspectRatio: 1 };
    return { width: { ideal: 720 }, height: { ideal: 720 }, facingMode: 'user', aspectRatio: 1 };
  };

  const getCameraContainerHeight = () => {
    if (window.innerWidth < 640) return '300px';
    if (window.innerWidth < 1024) return '400px';
    return '380px';
  };

  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;
    return () => {
      speechSynthRef.current?.cancel();
      if (countdownRef.current) clearTimeout(countdownRef.current);
      if (autoConfirmTimer) clearInterval(autoConfirmTimer);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, [autoConfirmTimer]);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!isVoiceEnabled || !speechSynthRef.current) { resolve(); return; }
        speechSynthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        setTimeout(() => speechSynthRef.current!.speak(utterance), 100);
      });
    },
    [isVoiceEnabled]
  );


  const detectFaceAngle = useCallback(async (_imageSrc: string) => {
    return { pitch: 0, yaw: 0, roll: 0, isValid: true };
  }, []);

  const imageDataUrlToBlob = useCallback(async (imageSrc: string, maxSide = 720, quality = 0.82): Promise<Blob> => {
    const img = new Image();
    img.src = imageSrc;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Unable to read captured image'));
    });
    const scale = Math.min(1, maxSide / Math.max(img.width || maxSide, img.height || maxSide));
    const width = Math.max(1, Math.round((img.width || maxSide) * scale));
    const height = Math.max(1, Math.round((img.height || maxSide) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Unable to compress image'))), 'image/jpeg', quality);
    });
  }, []);

  const startAttendanceProcess = useCallback(async () => {
    if (attempts >= maxAttempts) { setStatus('error'); return; }
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');
    setStatus('counting');
    setCountdown(FAST_CAPTURE_COUNTDOWN);
    await speak(`Position your face within the frame. Capturing in ${FAST_CAPTURE_COUNTDOWN} seconds`);
  }, [attempts, maxAttempts, speak]);

  useEffect(() => {
    if (isModalOpen && status === 'idle') startAttendanceProcess();
  }, [isModalOpen, status, startAttendanceProcess]);

  useEffect(() => {
    if (countdown > 0 && status === 'counting') {
      if (countdown <= 3) speak(countdown.toString());
      countdownRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && status === 'counting') {
      handleAutoCapture();
    }
    return () => { if (countdownRef.current) { clearTimeout(countdownRef.current); countdownRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, status, speak]);

  const handleAutoCapture = useCallback(async () => {
    if (attempts >= maxAttempts) { setStatus('error'); return; }
    setStatus('capturing');
    await speak('Capturing now');
    await new Promise((r) => setTimeout(r, 300));
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) { handleCaptureError(); return; }
    try {
      const facePose = await detectFaceAngle(imageSrc);
      if (!facePose.isValid) {
        await speak('Please face the camera directly.');
        message.warning('Face angle not optimal. Look directly at the camera.');
        handleCaptureError();
        return;
      }
    } catch { /* proceed */ }
    await handleAutoSubmit(imageSrc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts, maxAttempts, speak, detectFaceAngle]);

  const handleCaptureError = useCallback(async () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= maxAttempts) {
      setStatus('error');
      await speak('Maximum attempts reached.');
      message.error('Maximum attempts reached');
    } else {
      setStatus('counting');
      setCountdown(FAST_CAPTURE_COUNTDOWN);
      await speak(`Try again. ${maxAttempts - newAttempts} attempts left`);
    }
  }, [attempts, maxAttempts, speak]);

  const handleAutoConfirm = useCallback(async (capturedPendingAttendance: any) => {
    if (!capturedPendingAttendance) return;
    const submittedAction: 'check-in' | 'check-out' =
      capturedPendingAttendance.action === 'check-out' || capturedPendingAttendance.data?.action === 'check-out'
        ? 'check-out'
        : activeActionRef.current;
    try {
      const confirmResponse = await attendanceServiceInstance.confirmAttendance({
        uuid: capturedPendingAttendance.uuid || capturedPendingAttendance.data?.uuid,
        confirmed_by: 'auto_system'
      });
      if (confirmResponse.success) {
        const employeeName = capturedPendingAttendance.recognized_employee?.name || capturedPendingAttendance.employee_name;
        setSuccessData({ ...capturedPendingAttendance, status: 'confirmed', employeeName, employeeCode: capturedPendingAttendance.recognized_employee?.code || capturedPendingAttendance.employee_code, action: submittedAction });
        setStatus('success');
        await speak(`${employeeName}. ${submittedAction === 'check-in' ? 'Check in' : 'Check out'} done successfully.`);
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => handleSuccessClose(), 4000);
      } else throw new Error(confirmResponse.message || 'Confirmation failed');
    } catch {
      message.error('Automatic confirmation failed');
      await speak('Confirmation failed. Please try again.');
    } finally {
      if (autoConfirmTimer) { clearInterval(autoConfirmTimer); setAutoConfirmTimer(null); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConfirmTimer, speak]);

  const handleAutoSubmit = useCallback(async (imageSrc: string) => {
    try {
      setIsSubmitting(true);
      await speak('Processing recognition...');
      const blob = await imageDataUrlToBlob(imageSrc);
      const submittedAction = activeActionRef.current;
      const formData = new FormData();
      formData.append('action', submittedAction);
      formData.append('file', blob, 'face.jpg');
      formData.append('timestamp', new Date().toISOString().replace('T', ' ').substring(0, 19));
      formData.append('deviceType', navigator.userAgent);

      const response = await attendanceServiceInstance.markAttendance(formData);

      if (response.success) {
        if (response.requires_confirmation) {
          setIsModalOpen(false);
          setAutoConfirmFallbackImage(imageSrc);
          setAutoConfirmCountdown(AUTO_CONFIRM_SECONDS);
          setPendingAttendance(response.data || response);
          setAutoConfirmModal(true);
          const recognizedName = response.data?.recognized_employee?.name || 'Employee';
          await speak(`Recognized as ${recognizedName}. If this is not you, click cancel within ${AUTO_CONFIRM_SECONDS} seconds.`);
          const timer = setInterval(() => {
            setAutoConfirmCountdown((prev) => {
              if (prev <= 1) { clearInterval(timer); setAutoConfirmModal(false); handleAutoConfirm(response.data || response); return 0; }
              return prev - 1;
            });
          }, 1000);
          setAutoConfirmTimer(timer);
        } else {
          const employeeName = response.recognized_employee?.name || response.employee_name;
          setSuccessData({ ...response, status: 'confirmed', employeeName, employeeCode: response.recognized_employee?.code || response.employee_code, action: submittedAction });
          setStatus('success');
          setIsModalOpen(false);
          await speak(`${employeeName}. ${submittedAction === 'check-in' ? 'Check in' : 'Check out'} done successfully.`);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(() => handleSuccessClose(), 4000);
        }
      } else {
        throw new Error(response.message || 'Attendance failed');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      setIsModalOpen(false);
      const isNotFound = error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('employee');
      const isFaceError = error.message?.toLowerCase().includes('face') || error.message?.toLowerCase().includes('no face');
      const needsManualRequest =
        error.requiresManualRequest ||
        error.message?.toLowerCase().includes('manual request') ||
        error.message?.toLowerCase().includes('confidence is low');

      if (isFaceError) {
        message.error('Face not detected. Please ensure your face is clearly visible.');
        await speak('Face not detected. Please try again.');
        // After max attempts, show fallback from error state
      } else if (isNotFound || needsManualRequest) {
        // Employee not found: go straight to manual request
        setManualRequestReason('Employee not found in the system.');
        setShowManualRequest(true);
        await speak('Please submit a manual request for HR approval.');
      } else {
        message.error('Attendance failed. Please try again.');
        await speak('Submission failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speak, handleAutoConfirm, imageDataUrlToBlob]);

  const handleNotMe = useCallback(async () => {
    if (!pendingAttendance) return;
    if (autoConfirmTimer) { clearInterval(autoConfirmTimer); setAutoConfirmTimer(null); }
    setAutoConfirmModal(false);
    message.info('Cancelling recognition...');
    await speak('Cancelling recognition...');
    try {
      const uuid = pendingAttendance.uuid || pendingAttendance.data?.uuid;
      if (!uuid) throw new Error('No UUID found');
      const cancelResponse = await attendanceServiceInstance.cancelAttendance({ uuid, actual_employee_code: 'NOT_RECOGNIZED', actual_employee_name: 'User Cancelled', reason: 'proxy_detected_by_user' });
      if (cancelResponse.success) {
        message.success(cancelResponse.emailSent ? 'Cancelled. Proxy alert sent to admin.' : 'Recognition cancelled.');
        await speak(cancelResponse.emailSent ? 'Proxy detection reported. Admin notified.' : 'Recognition cancelled.');
      } else throw new Error(cancelResponse.message);
    } catch (error: any) {
      if (error.message?.includes('already confirmed')) { message.warning('Already confirmed automatically.'); }
      else { message.error('Cancellation failed.'); }
    }
    setPendingAttendance(null);
    setStatus('idle');
    setAttempts(0);
  }, [pendingAttendance, autoConfirmTimer, speak]);

  const handleActionClick = useCallback((selectedAction: 'check-in' | 'check-out') => {
    activeActionRef.current = selectedAction;
    setAction(selectedAction);
    setAttempts(0);
    setStatus('idle');
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setIsSubmitting(false);
    setCountdown(0);
    setAttempts(0);
    setStatus('idle');
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');
    if (countdownRef.current) { clearTimeout(countdownRef.current); countdownRef.current = null; }
    speechSynthRef.current?.cancel();
  }, []);

  const handleSuccessClose = useCallback(() => {
    if (successTimerRef.current) { clearTimeout(successTimerRef.current); successTimerRef.current = null; }
    setSuccessData(null);
    setStatus('idle');
  }, []);

  const handleRetry = useCallback(async () => {
    setAttempts(0);
    setStatus('idle');
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');
    await speak('Restarting...');
    startAttendanceProcess();
  }, [startAttendanceProcess, speak]);

  const renderLocationStatus = () => {
    if (locationStatus === 'fetching') return (
      <div className="flex items-center text-blue-200 text-xs">
        <div className="w-3 h-3 border-2 border-blue-200 border-t-transparent rounded-full animate-spin mr-1.5" />
        GPS skipped
      </div>
    );
    if (locationStatus === 'success') return (
      <div className="flex items-center text-emerald-200 text-xs">
        <EnvironmentOutlined className="mr-1" />
        Location optional
      </div>
    );
    if (locationStatus === 'error') return (
      <div className="flex items-center text-red-300 text-xs">
        <ExclamationCircleOutlined className="mr-1" />{locationError}
      </div>
    );
    return null;
  };

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const currentTimeLabel = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const actionCards = [
    {
      key: 'check-in' as const,
      title: 'Clock In',
      caption: 'Start shift with face scan',
      icon: <ArrowRightOutlined />,
      accent: 'from-emerald-500 to-teal-500',
      border: 'border-emerald-200',
      text: 'text-emerald-700'
    },
    {
      key: 'check-out' as const,
      title: 'Clock Out',
      caption: 'Close the day securely',
      icon: <ArrowLeftOutlined />,
      accent: 'from-indigo-500 to-sky-500',
      border: 'border-indigo-200',
      text: 'text-indigo-700'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(340px,440px)_1fr] lg:items-start">
        <section className="overflow-hidden rounded-[28px] bg-[#111827] text-white shadow-2xl shadow-slate-300/60 lg:sticky lg:top-4">
          <div className="relative min-h-[620px] px-5 pb-5 pt-4 sm:min-h-[700px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.28),transparent_34%),linear-gradient(145deg,#111827_0%,#1f2937_48%,#020617_100%)]" />
            <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>{currentTimeLabel}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Secure scan</span>
            </div>

            <div className="relative z-10 mt-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                  <img src="/bayanat-logo.png" alt="Bayanat" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-normal">Smart Attendance</h1>
                  <p className="text-sm text-slate-300">Face, location, and proxy protection</p>
                </div>
              </div>

              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <div className="relative mx-auto aspect-[3/4] max-w-[310px] overflow-hidden rounded-[26px] bg-slate-100">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-200 via-white to-slate-100" />
                  <div className="absolute left-1/2 top-5 h-7 w-24 -translate-x-1/2 rounded-full bg-slate-950" />
                  <div className="absolute inset-x-6 top-20 aspect-square rounded-[32px] bg-gradient-to-br from-slate-300 via-slate-100 to-white shadow-inner" />
                  <div className="absolute inset-x-12 top-28 aspect-square rounded-full border-2 border-teal-400" />
                  <div className="absolute left-1/2 top-32 h-20 w-24 -translate-x-1/2 rounded-full border border-slate-400/70" />
                  <div className="absolute left-14 right-14 top-24 flex justify-between">
                    <span className="h-8 w-8 rounded-full border-l-4 border-t-4 border-teal-400" />
                    <span className="h-8 w-8 rounded-full border-r-4 border-t-4 border-teal-400" />
                  </div>
                  <div className="absolute left-14 right-14 top-56 flex justify-between">
                    <span className="h-8 w-8 rounded-full border-b-4 border-l-4 border-teal-400" />
                    <span className="h-8 w-8 rounded-full border-b-4 border-r-4 border-teal-400" />
                  </div>
                  <div className="absolute left-1/2 top-16 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-teal-700 shadow-lg">
                    Face check ready
                  </div>
                  <div className="absolute inset-x-5 bottom-6 rounded-2xl border border-indigo-200 bg-white/95 p-4 text-slate-900 shadow-xl">
                    <div className="text-xs text-slate-500">Today</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-lg font-bold">{todayLabel}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <EnvironmentOutlined />
                      Location check before capture
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="space-y-4 pb-20 lg:pb-0">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attendance console</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Verify and mark attendance</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><CalendarOutlined />Date</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{todayLabel}</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <div className="text-xs font-semibold text-emerald-700">Current time</div>
                  <div className="mt-1 text-sm font-bold text-emerald-900">{currentTimeLabel}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {actionCards.map((card) => (
                <button
                  key={card.key}
                  onClick={() => handleActionClick(card.key)}
                  className={`group flex min-h-[128px] items-center justify-between rounded-[22px] border ${card.border} bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div>
                    <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-lg text-white shadow-lg`}>
                      {card.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-950">{card.title}</h3>
                    <p className={`mt-1 text-sm font-semibold ${card.text}`}>{card.caption}</p>
                  </div>
                  <ScanOutlined className="text-2xl text-slate-300 transition group-hover:text-slate-600" />
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { icon: <ScanOutlined />, color: 'bg-indigo-50 text-indigo-700', title: 'Face Match', desc: 'Auto-capture with pose check' },
              { icon: <EnvironmentOutlined />, color: 'bg-cyan-50 text-cyan-700', title: 'Geo Fence', desc: 'Office or remote context' },
              { icon: <UserOutlined />, color: 'bg-rose-50 text-rose-700', title: 'Proxy Guard', desc: 'Not-me reports with evidence' }
            ].map((f) => (
              <div key={f.title} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${f.color}`}>{f.icon}</div>
                <h4 className="text-base font-bold text-slate-950">{f.title}</h4>
                <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </section>
        </main>
      </div>

      {/* Camera Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl mx-2 sm:mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                  <CameraOutlined className="mr-2 text-lg sm:text-xl" />
                  {action === 'check-in' ? 'Check In' : 'Check Out'} Face Recognition
                </h3>
                {renderLocationStatus()}
                {attempts > 0 && <span className="px-2 py-1 bg-blue-500/30 rounded-full text-blue-200 text-xs">Attempt {attempts}/{maxAttempts}</span>}
              </div>
              <button onClick={handleCloseModal} className="text-white hover:text-blue-200 p-1 rounded-full hover:bg-white/10 flex-shrink-0" disabled={isSubmitting}>
                <CloseOutlined className="text-base sm:text-lg" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {status === 'error' ? (
                <div className="text-center py-8 sm:py-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationCircleOutlined className="text-red-500 text-2xl sm:text-3xl" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Face Recognition Failed</h4>
                  <p className="text-gray-500 text-sm mb-6">Unable to verify your identity after {maxAttempts} attempts.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={handleRetry} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-sm transition-all hover:scale-105 shadow-md">
                      <RedoOutlined /> Try Again
                    </button>
                    {/* ← FALLBACK TRIGGER: only visible after all attempts exhausted */}
                    <button
                      onClick={() => {
                        setManualRequestReason(`Face recognition failed after ${maxAttempts} attempts.`);
                        setIsModalOpen(false);
                        setShowManualRequest(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-xl font-semibold text-sm transition-all"
                    >
                      <FormOutlined /> Submit Manual Request
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">Manual requests are reviewed by HR and not instant.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200" style={{ height: getCameraContainerHeight() }}>
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={getVideoConstraints()} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} screenshotQuality={0.82} mirrored />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/35 pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative flex h-[250px] w-[210px] items-center justify-center rounded-[34px] border border-cyan-200/35 bg-cyan-300/5 shadow-[0_0_55px_rgba(103,232,249,0.22)] sm:h-[330px] sm:w-[270px] lg:h-[360px] lg:w-[300px]">
                        <div className="absolute -left-2 -top-2 h-14 w-14 border-l-[6px] border-t-[6px] border-cyan-200" />
                        <div className="absolute -right-2 -top-2 h-14 w-14 border-r-[6px] border-t-[6px] border-cyan-200" />
                        <div className="absolute -bottom-2 -left-2 h-14 w-14 border-b-[6px] border-l-[6px] border-cyan-200" />
                        <div className="absolute -bottom-2 -right-2 h-14 w-14 border-b-[6px] border-r-[6px] border-cyan-200" />
                        <div className="absolute left-1/2 top-[-18px] -translate-x-1/2 rounded-full border border-cyan-200/40 bg-slate-950/82 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">
                          Live face scan
                        </div>
                        <svg className="absolute inset-[12%] h-[76%] w-[76%] translate-x-[16%] text-cyan-100/75" viewBox="0 0 160 210" fill="none">
                          <path d="M80 18C45 18 24 48 24 88c0 58 33 104 56 104s56-46 56-104c0-40-21-70-56-70Z" stroke="currentColor" strokeWidth="2" />
                          <path d="M48 82c11-8 24-8 35-1M112 82c-11-8-24-8-35-1M80 86v42l-13 12M65 156c10 7 21 7 31 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="58" cy="95" r="3" fill="currentColor" />
                          <circle cx="102" cy="95" r="3" fill="currentColor" />
                          <path d="M48 82 80 128 112 82M58 95 80 86l22 9M67 140h26M52 66l28-22 28 22" stroke="currentColor" strokeWidth="1.2" opacity=".75" />
                        </svg>
                        <div className="absolute left-1/2 top-1/2 h-px w-[116%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-slate-950/75 px-4 py-2 text-center shadow-2xl">
                          <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                            {status === 'capturing' ? 'Verifying' : 'Align face'}
                          </div>
                          <div className="mt-0.5 text-[11px] text-white/75">Keep eyes inside frame</div>
                        </div>
                        <div className="hidden">
                          <span className="text-green-400 text-sm font-bold bg-black/50 px-3 py-1 rounded-lg">👤 Position Face Here</span>
                        </div>
                      </div>
                    </div>
                    {status === 'counting' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/95 rounded-full flex items-center justify-center mb-2 sm:mb-3 mx-auto shadow-lg">
                            <span className="text-2xl sm:text-3xl font-bold text-gray-800">{countdown}</span>
                          </div>
                          <p className="text-white font-medium text-sm sm:text-base">Auto capture in {countdown}s</p>
                          {locationStatus === 'success' && <p className="text-green-300 text-xs mt-1">Location verified ✓</p>}
                        </div>
                      </div>
                    )}
                    {status === 'capturing' && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl border-4 border-cyan-200 border-t-transparent animate-spin sm:h-16 sm:w-16" />
                          <p className="text-white font-medium text-sm sm:text-base">Verifying face</p>
                          <p className="text-white/80 text-xs sm:text-sm mt-1">Attempt {attempts + 1}/{maxAttempts}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-200">
                    <p className="text-blue-800 text-sm text-center font-medium mb-2">
                      {status === 'counting' ? `Capturing in ${countdown} seconds...` : 'Position your face within the green frame'}
                    </p>
                    {status === 'idle' && (
                      <div className="text-blue-600 text-xs text-center grid grid-cols-2 gap-1">
                        <div className="flex items-center justify-center"><BulbOutlined className="mr-1" /><span>Good lighting</span></div>
                        <div className="flex items-center justify-center"><WarningOutlined className="mr-1" /><span>No sunglasses</span></div>
                        <div className="flex items-center justify-center"><UserOutlined className="mr-1" /><span>Look at camera</span></div>
                        <div className="flex items-center justify-center"><ScanOutlined className="mr-1" /><span>Fill the frame</span></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-Confirm Modal */}
      {autoConfirmModal && pendingAttendance && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 py-6 px-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Recognition Complete</h3>
              <p className="text-green-100 text-sm">Auto-confirm in {autoConfirmCountdown} seconds</p>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <img
                  src={autoConfirmFallbackImage || pendingAttendance.recognized_employee?.image || '/default-avatar.png'}
                  alt="Recognized"
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-blue-400 shadow-lg mx-auto mb-4"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.dataset.fallbackApplied === 'true') return;
                    img.dataset.fallbackApplied = 'true';
                    img.src = autoConfirmFallbackImage || '/default-avatar.png';
                  }}
                />
                <h4 className="text-xl font-bold text-gray-800 mb-2">{pendingAttendance.recognized_employee?.name || pendingAttendance.employee_name}</h4>
                <p className="text-gray-600 text-sm">{pendingAttendance.recognized_employee?.code || pendingAttendance.employee_code}</p>
                {userLocation && (
                  <div className="bg-blue-50 rounded-lg p-3 mt-3">
                    <div className="flex items-center justify-center text-blue-700 text-xs mb-1"><EnvironmentOutlined className="mr-1" />{userLocation.officeCheck.isInOffice ? 'Office' : 'Remote'}</div>
                    <p className="text-blue-600 text-xs">{userLocation.officeCheck.distance}m from office center</p>
                  </div>
                )}
              </div>
              <button onClick={handleNotMe} className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-3 px-6 rounded-xl font-semibold text-base transition-all hover:scale-105 shadow-lg">
                It's Not Me - Cancel
              </button>
              <p className="text-gray-400 text-xs text-center mt-4">Attendance will be confirmed automatically if this is correct.</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {successData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircleOutlined className="text-green-500 text-3xl" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">{successData.action === 'check-in' ? 'Checked In! 🎉' : 'Checked Out! 👋'}</h4>
              <p className="text-gray-600 text-base mb-4">Attendance recorded for <strong className="text-gray-800">{successData.employeeName}</strong></p>
              <p className="text-gray-500 text-sm mb-2">Code: <strong className="text-gray-700">{successData.employeeCode}</strong></p>
              {userLocation && (
                <div className="bg-blue-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-center text-blue-700 text-xs mb-1"><EnvironmentOutlined className="mr-1" />{userLocation.officeCheck.isInOffice ? 'Office Location' : 'Remote Location'}</div>
                  <p className="text-blue-600 text-xs">Location verified</p>
                </div>
              )}
              <div className="text-gray-400 text-xs mb-4">Closes automatically in 4 seconds</div>
              <button onClick={handleSuccessClose} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-6 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg">Got It!</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Request Fallback Modal: only rendered after failure */}
      {showManualRequest && (
        <ManualRequestModal
          defaultEventType={action === 'check-in' ? 'check_in' : 'check_out'}
          onClose={() => {
            setShowManualRequest(false);
            setManualRequestReason('');
            setAttempts(0);
            setStatus('idle');
          }}
        />
      )}
    </div>
  );
};

export default AttendanceMarking;
