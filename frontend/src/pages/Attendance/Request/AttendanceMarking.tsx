import { useState, useRef, useCallback, useEffect } from 'react';
import { message, Select, Radio, Tag } from 'antd';
import {
  CameraOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
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

// MANUAL REQUEST MODAL
const LegacyManualRequestModal = ({ onClose, defaultEventType }: { onClose: () => void; defaultEventType: 'check_in' | 'check_out' }) => {
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
      form.append('requested_by', selectedEmp?.full_name ?? selectedEmp?.name ?? selectedEmployee ?? 'Unknown');

      const response = await attendanceServiceInstance.createAttendanceRequest(form);
      if (response?.success) {
        message.success(`Request submitted.`);
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

  const isReady = !!selectedEmployee && !!capturedImage;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FormOutlined style={{ color: '#fff', fontSize: 12 }} />
              </div>
              <span className="font-semibold text-amber-900 text-sm">Manual Attendance Request</span>
            </div>
            <p className="text-amber-700 text-xs leading-snug">
              This is for exceptional cases only — when face recognition couldn't verify you.
            </p>
          </div>
          <button onClick={onClose} className="text-amber-400 hover:text-amber-600 transition-colors ml-3 mt-0.5 flex-shrink-0">
            <CloseOutlined />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain' }}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <UserOutlined className="mr-1" />
              Employee
            </label>
            <Select
              showSearch
              placeholder="Search by code or name"
              value={selectedEmployee || undefined}
              onChange={setSelectedEmployee}
              style={{ width: '100%' }}
              size="middle"
              loading={loadingEmployees}
              optionFilterProp="label"
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={employees.map((e) => ({
                value: e.employee_code,
                label: `${e.employee_code} — ${e.full_name}`
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</label>
            <Radio.Group value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ width: '100%' }}>
              <Radio.Button value="check_in" style={{ width: '50%', textAlign: 'center' }}>
                ✅ Check-In
              </Radio.Button>
              <Radio.Button value="check_out" style={{ width: '50%', textAlign: 'center' }}>
                🔴 Check-Out
              </Radio.Button>
            </Radio.Group>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <CameraOutlined className="mr-1" />
              Photo
            </label>
            <div className="flex justify-center">
              {!capturedImage ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={220}
                  height={220}
                  videoConstraints={{ facingMode: 'user' }}
                  style={{ borderRadius: 10, border: '2px solid #e5e7eb', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div className="relative inline-block">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    style={{
                      width: 220,
                      height: 220,
                      objectFit: 'cover',
                      borderRadius: 10,
                      border: '2px solid #22c55e',
                      display: 'block'
                    }}
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
            <div className="text-center mt-3 flex flex-col items-center gap-3">
              {!capturedImage ? (
                <button
                  onClick={capture}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <CameraOutlined /> Capture Photo
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={!isReady || isSubmitting}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                      isReady && !isSubmitting
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? 'Submitting…' : '✅ Submit Attendance Request'}
                  </button>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <RedoOutlined /> Retake Photo
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isReady || isSubmitting}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isReady && !isSubmitting
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

void LegacyManualRequestModal;

const ManualRequestModal = ({ onClose, defaultEventType }: { onClose: () => void; defaultEventType: 'check_in' | 'check_out' }) => {
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

  const selectedEmployeeRecord = employees.find((e) => e.employee_code === selectedEmployee);
  const isReady = !!selectedEmployee && !!capturedImage;

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setCapturedImage(imageSrc);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) return message.warning('Please select an employee.');
    if (!capturedImage) return message.warning('Please capture a photo first.');

    setIsSubmitting(true);
    try {
      const blob = await (await fetch(capturedImage)).blob();
      const form = new FormData();
      form.append('file', new File([blob], 'capture.jpg', { type: blob.type }));
      form.append('employee_code', selectedEmployee);
      form.append('event_type', eventType);
      form.append('requested_by', selectedEmployeeRecord?.full_name ?? selectedEmployeeRecord?.name ?? selectedEmployee ?? 'Unknown');

      const response = await attendanceServiceInstance.createAttendanceRequest(form);
      if (response?.success) {
        message.success('Request submitted. HR will review it shortly.');
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-0 backdrop-blur-md sm:p-3">
      <div className="flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-none bg-[#f8fafc] shadow-2xl sm:h-[92dvh] sm:max-h-[720px] sm:rounded-[22px]">
        <div className="relative shrink-0 overflow-hidden bg-[#111827] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:px-5 sm:pt-3">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(20,184,166,0.32),transparent_28%),linear-gradient(135deg,#111827_0%,#1f2937_58%,#020617_100%)]" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-lg sm:flex">
                <FormOutlined />
              </div>
              <div className="min-w-0">
                <p className="hidden text-xs font-semibold uppercase tracking-wide text-cyan-100 sm:block">Exception flow</p>
                <h3 className="max-w-[240px] text-[26px] font-bold leading-[1.08] tracking-normal sm:mt-0.5 sm:max-w-none sm:text-xl">Manual Attendance Request</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close manual attendance request"
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 text-xs sm:max-w-md">
            {[
              { label: 'Employee', done: !!selectedEmployee },
              { label: 'Type', done: !!eventType },
              { label: 'Photo', done: !!capturedImage }
            ].map((step) => (
              <div
                key={step.label}
                className={`rounded-xl border px-3 py-1 ${
                  step.done ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-white/8 text-slate-300'
                }`}
              >
                <div className="font-semibold">{step.label}</div>
                <div className="text-[11px] opacity-80">{step.done ? 'Ready' : 'Needed'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto p-3 sm:grid-cols-[1fr_250px] sm:p-3">
          <section className="min-h-0 space-y-2 overflow-visible">
            <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <UserOutlined /> Employee
              </label>
              <Select
                showSearch
                placeholder="Search by code or name"
                value={selectedEmployee || undefined}
                onChange={setSelectedEmployee}
                style={{ width: '100%' }}
                size="middle"
                loading={loadingEmployees}
                optionFilterProp="label"
                dropdownStyle={{ zIndex: 10001 }}
                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                options={employees.map((e) => ({
                  value: e.employee_code,
                  label: `${e.employee_code} - ${e.full_name}`
                }))}
              />
              {selectedEmployeeRecord && (
                <div className="mt-2 rounded-xl bg-slate-50 px-3 py-1.5">
                  <div className="truncate text-sm font-bold text-slate-900">{selectedEmployeeRecord.full_name}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {selectedEmployeeRecord.employee_code}
                    {selectedEmployeeRecord.department ? ` | ${selectedEmployeeRecord.department}` : ''}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Attendance type</label>
              <Radio.Group value={eventType} onChange={(e) => setEventType(e.target.value)} className="grid w-full grid-cols-2 gap-2">
                <Radio.Button
                  value="check_in"
                  className="!h-auto !rounded-xl !border !border-slate-200 !px-3 !py-1.5 !text-center !shadow-sm"
                >
                  <span className="block text-sm font-bold">Check In</span>
                  <span className="block text-xs text-slate-500">Start shift</span>
                </Radio.Button>
                <Radio.Button
                  value="check_out"
                  className="!h-auto !rounded-xl !border !border-slate-200 !px-3 !py-1.5 !text-center !shadow-sm"
                >
                  <span className="block text-sm font-bold">Check Out</span>
                  <span className="block text-xs text-slate-500">End shift</span>
                </Radio.Button>
              </Radio.Group>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CameraOutlined /> Evidence photo
                </label>
                {capturedImage && (
                  <Tag color="success" icon={<CheckCircleOutlined />} className="!mr-0">
                    Captured
                  </Tag>
                )}
              </div>
              <div className="relative mx-auto h-[240px] w-full max-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 min-[390px]:h-[270px] sm:aspect-square sm:h-auto sm:max-w-[190px]">
                {!capturedImage ? (
                  <>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      screenshotQuality={0.82}
                      videoConstraints={{ facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }}
                      mirrored
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-40 w-32 rounded-[28px] border-4 border-teal-400/90 shadow-[0_0_30px_rgba(45,212,191,0.35)] sm:h-28 sm:w-24" />
                    </div>
                    <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-slate-950/65 px-2.5 py-1 text-[11px] font-semibold text-white">
                      Align face
                    </div>
                  </>
                ) : (
                  <img src={capturedImage} alt="Captured" className="h-full w-full object-cover" />
                )}
              </div>
              <button
                onClick={capturedImage ? () => setCapturedImage(null) : capture}
                className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  capturedImage
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-950 text-white shadow-lg hover:bg-slate-800'
                }`}
              >
                {capturedImage ? <RedoOutlined /> : <CameraOutlined />}
                {capturedImage ? 'Retake Photo' : 'Capture Photo'}
              </button>
            </div>
          </section>

          <aside className="space-y-2 overflow-visible">
            <div className="rounded-2xl border border-slate-200 bg-white p-2.5 text-sm shadow-sm sm:p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Review</div>
              <div className="space-y-2">
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

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900 sm:p-3">
              <div className="font-bold">Pending HR approval</div>
              <p className="mt-1 hidden text-xs leading-5 text-amber-800 sm:block">Attendance is created after HR approval.</p>
            </div>
          </aside>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_28px_rgba(15,23,42,0.12)] backdrop-blur sm:px-4 sm:py-2.5 sm:shadow-none">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isReady || isSubmitting}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              isReady && !isSubmitting
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg hover:shadow-xl'
                : 'cursor-not-allowed bg-slate-200 text-slate-400'
            }`}
          >
            {isSubmitting ? 'Submitting...' : capturedImage ? 'Submit Request' : 'Submit after photo'}
          </button>
        </div>
      </div>
    </div>
  );
};

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

  const [showManualRequest, setShowManualRequest] = useState(false);
  const [, setManualRequestReason] = useState<string>('');
  const [performanceSummary, setPerformanceSummary] = useState<any>(null);

  const [userLocation, setUserLocation] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [, setLocationError] = useState<string>('');

  const AUTO_CONFIRM_DELAY_MS = 3000;
  const AUTO_CONFIRM_SECONDS = Math.floor(AUTO_CONFIRM_DELAY_MS / 1000);

  const [autoConfirmModal, setAutoConfirmModal] = useState(false);
  const [pendingAttendance, setPendingAttendance] = useState<any>(null);
  const [autoConfirmFallbackImage, setAutoConfirmFallbackImage] = useState<string | null>(null);
  const [autoConfirmCountdown, setAutoConfirmCountdown] = useState<number>(AUTO_CONFIRM_SECONDS);
  const autoConfirmTimerRef = useRef<number | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const activeActionRef = useRef<'check-in' | 'check-out'>('check-in');
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);
  const successShownAtRef = useRef<number | null>(null);
  const suppressSuccessUIRef = useRef<boolean>(false);

  const closeSuccessImmediate = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    successShownAtRef.current = null;
    setSuccessData(null);
    setStatus('idle');
  }, []);

  const getVideoConstraints = () => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1024;
    if (isMobile) return { width: { ideal: 360 }, height: { ideal: 360 }, facingMode: 'user', aspectRatio: 1 };
    if (isTablet) return { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user', aspectRatio: 1 };
    return { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user', aspectRatio: 1 };
  };

  const getCameraContainerHeight = () => {
    if (window.innerWidth < 640) return window.innerHeight >= 760 ? 'min(72dvh, 640px)' : 'min(68vh, 430px)';
    if (window.innerWidth < 1024) return 'min(76dvh, 680px)';
    return '100%';
  };

  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;
    return () => {
      speechSynthRef.current?.cancel();
      if (countdownRef.current) clearTimeout(countdownRef.current);
      if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    attendanceServiceInstance
      .getPerformanceSummary()
      .then((data) => {
        if (!cancelled) setPerformanceSummary(data);
      })
      .catch(() => {
        if (!cancelled) setPerformanceSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!isVoiceEnabled || !speechSynthRef.current) {
          resolve();
          return;
        }
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

  const FAST_CAPTURE_COUNTDOWN = 1;

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
    if (attempts >= maxAttempts) {
      setStatus('error');
      return;
    }
    setStatus('counting');
    setCountdown(FAST_CAPTURE_COUNTDOWN);
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');

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
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
        countdownRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, status, speak]);

  const handleAutoCapture = useCallback(async () => {
    if (attempts >= maxAttempts) {
      setStatus('error');
      return;
    }
    setStatus('capturing');
    await speak('Capturing now');
    await new Promise((r) => setTimeout(r, 300));
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      handleCaptureError();
      return;
    }
    try {
      const facePose = await detectFaceAngle(imageSrc);
      if (!facePose.isValid) {
        await speak('Please face the camera directly.');
        message.warning('Face angle not optimal. Look directly at the camera.');
        handleCaptureError();
        return;
      }
    } catch {
      /* proceed */
    }
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

  const handleAutoConfirm = useCallback(
    async (capturedPendingAttendance: any) => {
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
          setSuccessData({
            ...capturedPendingAttendance,
            status: 'confirmed',
            employeeName,
            employeeCode: capturedPendingAttendance.recognized_employee?.code || capturedPendingAttendance.employee_code,
            action: submittedAction
          });
          setStatus('success');
          await speak(`${employeeName}. ${submittedAction === 'check-in' ? 'Check in' : 'Check out'} done successfully.`);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          suppressSuccessUIRef.current = true;
          successTimerRef.current = window.setTimeout(() => {
            suppressSuccessUIRef.current = false;
            closeSuccessImmediate();
          }, 1000) as unknown as NodeJS.Timeout;
        } else throw new Error(confirmResponse.message || 'Confirmation failed');
      } catch {
        message.error('Automatic confirmation failed');
        await speak('Confirmation failed. Please try again.');
      } finally {
        if (autoConfirmTimerRef.current) {
          clearInterval(autoConfirmTimerRef.current);
          autoConfirmTimerRef.current = null;
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [speak]
  );

  const handleAutoSubmit = useCallback(
    async (imageSrc: string) => {
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
            const timer = window.setInterval(() => {
              setAutoConfirmCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(timer as unknown as number);
                  setAutoConfirmModal(false);
                  handleAutoConfirm(response.data || response);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            autoConfirmTimerRef.current = timer as unknown as number;
          } else {
            const employeeName = response.recognized_employee?.name || response.employee_name;
            setSuccessData({
              ...response,
              status: 'confirmed',
              employeeName,
              employeeCode: response.recognized_employee?.code || response.employee_code,
              action: submittedAction
            });
            setStatus('success');
            setIsModalOpen(false);
            await speak(`${employeeName}. ${submittedAction === 'check-in' ? 'Check in' : 'Check out'} done successfully.`);
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            // Suppress rendering of the success popup and close after 1s
            suppressSuccessUIRef.current = true;
            successTimerRef.current = window.setTimeout(() => {
              suppressSuccessUIRef.current = false;
              closeSuccessImmediate();
            }, 1000) as unknown as NodeJS.Timeout;
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
        } else if (isNotFound || needsManualRequest) {
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
    },
    [speak, handleAutoConfirm, imageDataUrlToBlob]
  );

  const handleNotMe = useCallback(async () => {
    if (!pendingAttendance) return;
    if (autoConfirmTimerRef.current) {
      clearInterval(autoConfirmTimerRef.current);
      autoConfirmTimerRef.current = null;
    }
    setAutoConfirmModal(false);
    message.info('Cancelling recognition...');
    await speak('Cancelling recognition...');
    try {
      const uuid = pendingAttendance.uuid || pendingAttendance.data?.uuid;
      if (!uuid) throw new Error('No UUID found');
      const cancelResponse = await attendanceServiceInstance.cancelAttendance({
        uuid,
        actual_employee_code: 'NOT_RECOGNIZED',
        actual_employee_name: 'User Cancelled',
        reason: 'proxy_detected_by_user'
      });
      if (cancelResponse.success) {
        message.success(cancelResponse.emailSent ? 'Cancelled. Proxy alert sent to admin.' : 'Recognition cancelled.');
        await speak(cancelResponse.emailSent ? 'Proxy detection reported. Admin notified.' : 'Recognition cancelled.');
      } else throw new Error(cancelResponse.message);
    } catch (error: any) {
      if (error.message?.includes('already confirmed')) {
        message.warning('Already confirmed automatically.');
      } else {
        message.error('Cancellation failed.');
      }
    }
    setPendingAttendance(null);
    setStatus('idle');
    setAttempts(0);
  }, [pendingAttendance, speak]);

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
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    speechSynthRef.current?.cancel();
  }, []);

  const handleSuccessClose = useCallback(() => {
    const MIN_MS = 4000;
    if (successShownAtRef.current) {
      const elapsed = Date.now() - successShownAtRef.current;
      if (elapsed < MIN_MS) {
        const remaining = MIN_MS - elapsed;
        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
        }
        successTimerRef.current = window.setTimeout(() => handleSuccessClose(), remaining) as unknown as NodeJS.Timeout;
        return;
      }
    }
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    successShownAtRef.current = null;
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
    if (locationStatus === 'fetching')
      return (
        <div className="flex items-center text-sky-700 text-xs">
          <div className="w-3 h-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-1.5" />
          GPS skipped
        </div>
      );
    if (locationStatus === 'success')
      return (
        <div className="flex items-center text-emerald-700 text-xs">
          <EnvironmentOutlined className="mr-1" />
          Location optional
        </div>
      );
    if (locationStatus === 'error')
      return (
        <div className="flex items-center text-amber-700 text-xs">
          <ExclamationCircleOutlined className="mr-1" />
          GPS skipped
        </div>
      );
    return null;
  };

  const nowLabel = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const terminalState =
    status === 'capturing'
      ? { label: 'Processing', color: 'text-blue-700', dot: 'bg-blue-500', ring: 'border-blue-400', glow: 'shadow-blue-500/40' }
      : status === 'counting'
        ? { label: 'Scanning', color: 'text-amber-700', dot: 'bg-amber-400', ring: 'border-amber-400', glow: 'shadow-amber-500/40' }
        : status === 'error'
          ? { label: 'Action needed', color: 'text-red-700', dot: 'bg-red-500', ring: 'border-red-400', glow: 'shadow-red-500/40' }
          : { label: 'Ready', color: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'border-emerald-400', glow: 'shadow-emerald-500/40' };

  return (
    <div className="relative bg-[#0d1117] text-[#f2f2f0] min-[600px]:h-[calc(100dvh-132px)] min-[600px]:min-h-0 min-[600px]:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(93,202,165,0.16),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(133,183,235,0.11),transparent_26%),linear-gradient(180deg,#11161d_0%,#0d1117_56%,#090c11_100%)]" />
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1500px] flex-col gap-2 px-3 py-2 sm:px-5 min-[600px]:h-full min-[600px]:px-3 min-[600px]:py-1 lg:px-4">
        <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-[#253039] bg-[rgba(24,29,35,0.74)] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur min-[600px]:flex-row min-[600px]:items-center min-[600px]:justify-between min-[600px]:p-2">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[#214f45] bg-[rgba(93,202,165,0.12)] px-3 py-1 text-xs font-semibold text-[#6fe2bd] shadow-sm min-[600px]:py-0.5">
              <span className={`h-2 w-2 rounded-full ${terminalState.dot}`} />
              {terminalState.label}
            </div>
            <h1 className="text-xl font-semibold text-[#f2f2f0] sm:text-2xl min-[600px]:text-xl lg:text-2xl">Face Attendance Terminal</h1>
            <p className="mt-0.5 hidden text-xs text-[#9a9a96] lg:block">Fast face verification with optional background GPS.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="rounded-xl border border-[#253039] bg-[rgba(18,23,29,0.86)] px-4 py-2 shadow-sm min-[600px]:px-3 min-[600px]:py-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a76]">Today</div>
              <div className="mt-1 text-sm font-semibold text-[#f2f2f0] min-[600px]:mt-0.5">{todayLabel}</div>
            </div>
            <div className="rounded-xl border border-[#1D9E75] bg-[#0F6E56] px-4 py-2 text-[#E1F5EE] shadow-[0_12px_34px_rgba(15,110,86,0.25)] min-[600px]:px-3 min-[600px]:py-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b8efe0]">Time</div>
              <div className="mt-1 text-sm font-semibold min-[600px]:mt-0.5">{nowLabel}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 min-[600px]:min-h-0 min-[600px]:grid-cols-1 min-[600px]:items-start min-[600px]:gap-2 xl:grid-cols-[1.05fr_0.95fr] xl:gap-3">
          <section className="relative min-h-[360px] overflow-hidden rounded-2xl border border-[#253039] bg-[rgba(24,29,35,0.9)] text-[#f2f2f0] shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur min-[600px]:min-h-[270px] lg:min-h-[300px] xl:min-h-[360px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(93,202,165,0.22),transparent_34%),radial-gradient(circle_at_70%_78%,rgba(239,159,39,0.08),transparent_28%),linear-gradient(135deg,rgba(31,39,46,0.92)_0%,rgba(20,24,30,0.96)_54%,rgba(12,16,22,0.98)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5DCAA5]/70 to-transparent" />
            <div className="relative grid h-full gap-3 p-4 min-[600px]:grid-cols-[1fr_260px] min-[600px]:items-center min-[720px]:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px] xl:flex xl:flex-col xl:gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="max-w-xl">
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#5DCAA5] min-[600px]:text-[10px]">Biometric access</div>
                  <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#f2f2f0] lg:text-4xl xl:text-3xl">Scan. Smile. Mark.</h2>
                  <p className="mt-2 text-sm leading-6 text-[#b4b8b6] lg:text-base xl:hidden">
                    Fast face verification with a friendly guided scan.
                  </p>
                  <div className="mt-4 hidden grid-cols-3 gap-2 text-xs font-semibold min-[600px]:grid xl:hidden">
                    <span className="rounded-full border border-[#254239] bg-[rgba(93,202,165,0.1)] px-3 py-2 text-[#6fe2bd]">Face ready</span>
                    <span className="rounded-full border border-[#26394e] bg-[rgba(133,183,235,0.1)] px-3 py-2 text-[#9bc8f5]">Quick scan</span>
                    <span className="rounded-full border border-[#4b3820] bg-[rgba(239,159,39,0.1)] px-3 py-2 text-[#FAC775]">HR backup</span>
                  </div>
                </div>
                <div className="hidden rounded-xl border border-[#253039] bg-[rgba(13,17,23,0.72)] px-4 py-3 text-right shadow-sm xl:block xl:px-3 xl:py-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#7a7a76]">Engine</div>
                  <div className="mt-1 text-sm font-semibold text-[#5DCAA5]">Face ID Ready</div>
                </div>
              </div>

              <div className="mx-auto flex w-full max-w-[320px] items-center justify-center xl:my-1 xl:flex-1 xl:max-w-[400px]">
                <div className="relative aspect-square w-full max-w-[220px] rounded-full border border-[#253039] bg-[rgba(13,17,23,0.86)] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.34)] lg:max-w-[250px] xl:max-w-[340px] xl:p-5">
                  <div className="absolute -inset-2 rounded-full border border-[#5DCAA5]/10" />
                  <div className="absolute inset-3 rounded-full border border-emerald-300/30 xl:inset-5" />
                  <div className="absolute inset-7 rounded-full border-2 border-dashed border-teal-300/50 xl:inset-10" />
                  <div className="absolute inset-12 rounded-full border-4 border-emerald-400/90 shadow-[0_0_62px_rgba(16,185,129,0.48)] xl:inset-16 xl:shadow-[0_0_70px_rgba(16,185,129,0.4)]" />
                  <div className="absolute inset-[28%] rounded-full bg-[rgba(93,202,165,0.14)] shadow-inner" />
                  <div className="absolute inset-[33%] rounded-full bg-[#0F6E56]" />
                  <div className="absolute left-1/2 top-[39%] h-3 w-3 -translate-x-1/2 rounded-full bg-[#E1F5EE]" />
                  <div className="absolute left-[42%] top-[49%] h-2 w-2 rounded-full bg-[#E1F5EE]" />
                  <div className="absolute right-[42%] top-[49%] h-2 w-2 rounded-full bg-[#E1F5EE]" />
                  <div className="absolute bottom-[31%] left-1/2 h-5 w-14 -translate-x-1/2 rounded-b-full border-b-4 border-emerald-300 shadow-[0_10px_24px_rgba(93,202,165,0.22)]" />
                  <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-[#0F6E56] px-3 py-1 text-[11px] font-bold text-[#E1F5EE] shadow-[0_10px_28px_rgba(15,110,86,0.35)] xl:top-4 xl:px-4 xl:text-xs">
                    LIVE SCAN
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#1D9E75] px-4 py-1.5 text-[11px] font-bold text-[#E1F5EE] shadow-[0_12px_30px_rgba(29,158,117,0.3)] xl:bottom-6 xl:py-2 xl:text-xs">
                    ACCESS READY
                  </div>
                </div>
              </div>

            </div>
          </section>

          <section className="flex min-h-0 flex-col gap-3 min-[600px]:gap-2">
            <div className="relative overflow-hidden rounded-2xl border border-[#253039] bg-[rgba(24,29,35,0.9)] p-3 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur min-[600px]:p-3 xl:p-3">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#85B7EB]/60 to-transparent" />
              <div className="mb-3 flex items-start justify-between gap-3 min-[600px]:mb-2">
                <div>
                  <h2 className="text-xl font-semibold text-[#f2f2f0] min-[600px]:text-lg lg:text-xl">Choose Action</h2>
                  <p className="mt-0.5 hidden text-xs text-[#9a9a96] lg:block">Large touch targets for tablet devices.</p>
                </div>
                <ScanOutlined className="text-2xl text-[#5DCAA5]" />
              </div>

              <div className="grid gap-2 min-[600px]:grid-cols-3 min-[600px]:gap-2 xl:grid-cols-1 xl:gap-1.5">
                <button
                  onClick={() => handleActionClick('check-in')}
                  className="group flex items-center justify-between rounded-xl border border-[#253039] bg-[linear-gradient(135deg,rgba(30,37,44,0.96),rgba(18,22,28,0.96))] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-200 hover:border-[#1D9E75] hover:bg-[#20242b] hover:shadow-[0_18px_45px_rgba(29,158,117,0.1)] active:scale-[0.99] min-[600px]:min-h-[104px] min-[600px]:flex-col min-[600px]:items-start min-[600px]:p-3 xl:min-h-0 xl:flex-row xl:items-center xl:p-3"
                >
                  <div className="flex items-center gap-4 min-[600px]:flex-col min-[600px]:items-start min-[600px]:gap-3 xl:flex-row xl:items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(93,202,165,0.14)] text-[#5DCAA5] shadow-lg min-[600px]:h-10 min-[600px]:w-10 lg:h-11 lg:w-11">
                      <ArrowRightOutlined className="text-xl" />
                    </div>
                    <div>
                  <div className="text-lg font-semibold text-[#f2f2f0] min-[600px]:text-base lg:text-lg">Check In</div>
                      <div className="text-sm text-[#9a9a96] min-[600px]:text-xs lg:text-sm">Start shift instantly</div>
                    </div>
                  </div>
                  <div className="hidden rounded-full bg-[rgba(93,202,165,0.14)] px-3 py-1 text-xs font-bold text-[#5DCAA5] shadow-sm sm:block">Scan</div>
                </button>

                <button
                  onClick={() => handleActionClick('check-out')}
                  className="group flex items-center justify-between rounded-xl border border-[#253039] bg-[linear-gradient(135deg,rgba(30,37,44,0.96),rgba(18,22,28,0.96))] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-200 hover:border-[#85B7EB] hover:bg-[#20242b] hover:shadow-[0_18px_45px_rgba(133,183,235,0.1)] active:scale-[0.99] min-[600px]:min-h-[104px] min-[600px]:flex-col min-[600px]:items-start min-[600px]:p-3 xl:min-h-0 xl:flex-row xl:items-center xl:p-3"
                >
                  <div className="flex items-center gap-4 min-[600px]:flex-col min-[600px]:items-start min-[600px]:gap-3 xl:flex-row xl:items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(133,183,235,0.14)] text-[#85B7EB] shadow-lg min-[600px]:h-10 min-[600px]:w-10 lg:h-11 lg:w-11">
                      <ArrowLeftOutlined className="text-xl" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#f2f2f0] min-[600px]:text-base lg:text-lg">Check Out</div>
                      <div className="text-sm text-[#9a9a96] min-[600px]:text-xs lg:text-sm">End shift instantly</div>
                    </div>
                  </div>
                  <div className="hidden rounded-full bg-[rgba(133,183,235,0.14)] px-3 py-1 text-xs font-bold text-[#85B7EB] shadow-sm sm:block">Scan</div>
                </button>

                <button
                  onClick={() => {
                    setManualRequestReason('');
                    setShowManualRequest(true);
                  }}
                  className="flex items-center justify-between rounded-xl border border-[#253039] bg-[linear-gradient(135deg,rgba(30,37,44,0.96),rgba(18,22,28,0.96))] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-200 hover:border-[#EF9F27] hover:bg-[#20242b] hover:shadow-[0_18px_45px_rgba(239,159,39,0.1)] active:scale-[0.99] min-[600px]:min-h-[104px] min-[600px]:flex-col min-[600px]:items-start min-[600px]:p-3 xl:min-h-0 xl:flex-row xl:items-center xl:p-3"
                >
                  <div className="flex items-center gap-4 min-[600px]:flex-col min-[600px]:items-start min-[600px]:gap-3 xl:flex-row xl:items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(239,159,39,0.14)] text-[#EF9F27] shadow-lg min-[600px]:h-10 min-[600px]:w-10 lg:h-11 lg:w-11">
                      <FormOutlined className="text-xl" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#f2f2f0] min-[600px]:text-base lg:text-lg">Manual Request</div>
                      <div className="text-sm text-[#9a9a96] min-[600px]:text-xs lg:text-sm">Use only when face scan cannot verify</div>
                    </div>
                  </div>
                  <div className="hidden rounded-full bg-[rgba(239,159,39,0.14)] px-3 py-1 text-xs font-bold text-[#FAC775] shadow-sm sm:block">HR review</div>
                </button>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-[#2c2f35] bg-[#1c1f24] p-3 shadow-sm xl:block">
              <div className="mb-3 flex items-center justify-between md:mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#f2f2f0]">System Health</h3>
                  <p className="hidden text-[11px] text-[#9a9a96] lg:block">Live accuracy and request load</p>
                </div>
                <span className="rounded-full bg-[rgba(93,202,165,0.14)] px-2.5 py-1 text-[11px] font-bold text-[#5DCAA5]">
                  {performanceSummary ? 'Online' : 'Checking'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 min-[600px]:gap-1.5">
                {[
                  { label: 'Scans', value: performanceSummary?.todayEvents ?? '-' },
                  { label: 'Avg Conf.', value: performanceSummary?.avgConfidence ? `${performanceSummary.avgConfidence}%` : '-' },
                  { label: 'Coverage', value: performanceSummary?.coveragePercent != null ? `${performanceSummary.coveragePercent}%` : '-' },
                  { label: 'Pending', value: performanceSummary?.pendingRequests ?? '-' },
                  { label: 'Proxy', value: performanceSummary?.todayProxyLogs ?? '-' }
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[#2c2f35] bg-[#14161a] px-3 py-2 min-[600px]:px-2 min-[600px]:py-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a7a76] min-[600px]:tracking-normal">{item.label}</div>
                    <div className="mt-1 text-sm font-semibold text-[#f2f2f0] min-[600px]:mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

          </section>
        </div>
      </div>

      {/* Camera Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-[#05080d] p-0 text-white sm:p-3">
          <div className="flex h-screen w-full flex-col overflow-hidden rounded-none border border-white/10 bg-[#0a0f17] shadow-2xl sm:h-[calc(100dvh-24px)] sm:max-w-[min(1600px,calc(100vw-24px))] sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0d121a] px-3 py-2 sm:px-4">
              <div className="flex items-center flex-wrap gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${terminalState.dot}`} />
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${terminalState.color}`}>{terminalState.label}</span>
                <h3 className="w-full text-sm font-bold text-white flex items-center sm:w-auto sm:text-base">
                  <CameraOutlined className="mr-2 text-lg sm:text-xl text-cyan-200" />
                  {action === 'check-in' ? 'Check In' : 'Check Out'}
                </h3>
                {renderLocationStatus()}
                {attempts > 0 && (
                  <span className="px-2 py-1 bg-white/10 rounded-full text-cyan-100 text-xs border border-white/10">
                    Attempt {attempts}/{maxAttempts}
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-white/10 p-2 rounded-full flex-shrink-0 border border-white/10"
                disabled={isSubmitting}
              >
                <CloseOutlined className="text-base sm:text-lg" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(93,202,165,0.15),transparent_34%),linear-gradient(180deg,#101722,#080c12)] p-3 sm:p-4">
              {status === 'error' ? (
                <div className="text-center py-8 sm:py-10 bg-red-50 border border-red-100 rounded-2xl">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationCircleOutlined className="text-red-500 text-2xl sm:text-3xl" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-950 mb-2">Face Recognition Failed</h4>
                  <p className="text-red-700 text-sm mb-6">Unable to verify your identity after {maxAttempts} attempts.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all shadow-md"
                    >
                      <RedoOutlined /> Try Again
                    </button>
                    <button
                      onClick={() => {
                        setManualRequestReason(`Face recognition failed after ${maxAttempts} attempts.`);
                        setIsModalOpen(false);
                        setShowManualRequest(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold text-sm transition-all"
                    >
                      <FormOutlined /> Submit Manual Request
                    </button>
                  </div>
                  <p className="text-xs text-red-600 mt-4">Manual requests are reviewed before approval.</p>
                </div>
              ) : (
                <div className="grid h-full min-h-0 w-full items-center gap-3 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div
                    className="relative mx-auto min-h-[260px] w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_24px_90px_rgba(0,0,0,0.45)]"
                    style={{ height: getCameraContainerHeight() }}
                  >
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={getVideoConstraints()}
                      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                      screenshotQuality={0.82}
                      mirrored
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(0,0,0,0.18)_68%,rgba(0,0,0,0.48)_100%)] pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative h-[260px] w-[230px] sm:h-[min(68vh,540px)] sm:w-[min(54vh,430px)] lg:h-[min(74vh,650px)] lg:w-[min(58vh,500px)]">
                        <div className={`absolute inset-0 rounded-[38px] border border-teal-200/22 bg-gradient-to-b from-cyan-200/6 via-transparent to-teal-300/8 ${terminalState.glow} shadow-[0_0_85px_rgba(45,212,191,0.2)]`} />
                        <div className="absolute inset-4 rounded-[30px] border border-white/8 bg-slate-950/10" />
                        <div className="absolute inset-x-6 top-[18%] h-px bg-gradient-to-r from-transparent via-cyan-100/60 to-transparent" />
                        <div className="absolute inset-x-6 top-[50%] h-px bg-gradient-to-r from-transparent via-cyan-100/50 to-transparent shadow-[0_0_20px_rgba(103,232,249,0.75)]" />
                        <div className="absolute inset-x-6 bottom-[22%] h-px bg-gradient-to-r from-transparent via-cyan-100/25 to-transparent" />
                        <div className="absolute left-0 top-0 h-16 w-16 rounded-tl-[30px] border-l-[7px] border-t-[7px] border-cyan-200" />
                        <div className="absolute right-0 top-0 h-16 w-16 rounded-tr-[30px] border-r-[7px] border-t-[7px] border-cyan-200" />
                        <div className="absolute bottom-0 left-0 h-16 w-16 rounded-bl-[30px] border-b-[7px] border-l-[7px] border-cyan-200" />
                        <div className="absolute bottom-0 right-0 h-16 w-16 rounded-br-[30px] border-b-[7px] border-r-[7px] border-cyan-200" />
                        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-cyan-200/35 bg-slate-950/80 px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100 shadow-lg backdrop-blur">
                          Secure Face ID
                        </div>
                        <div className="absolute left-1/2 top-[47%] flex h-[152px] w-[152px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-100/18 bg-slate-950/12 sm:h-[190px] sm:w-[190px] lg:h-[220px] lg:w-[220px]">
                          <div className="absolute inset-5 rounded-full border border-dashed border-cyan-100/16" />
                          <svg className="h-[72%] w-[72%] text-cyan-100/22" viewBox="0 0 180 180" fill="none">
                            <path d="M90 30c-31 0-52 24-52 58 0 46 27 78 52 78s52-32 52-78c0-34-21-58-52-58Z" stroke="currentColor" strokeWidth="4" />
                            <path d="M57 82c12-8 24-8 36 0M87 82c12-8 24-8 36 0M72 136c12 8 25 8 37 0" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                          </svg>
                        </div>
                        {status !== 'capturing' && (
                          <div className="absolute left-1/2 top-[52%] min-w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-slate-950/68 px-5 py-3 text-center shadow-2xl backdrop-blur-md">
                            <div className="text-lg font-bold text-white">
                              {status === 'counting' ? 'Hold still' : 'Center face'}
                            </div>
                            <div className="mt-1 text-sm text-white/75">Attempt {Math.min(attempts + 1, maxAttempts)}/{maxAttempts}</div>
                          </div>
                        )}
                        <div className="absolute bottom-6 left-1/2 min-w-[185px] -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/72 px-5 py-3 text-center shadow-2xl backdrop-blur">
                          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-100">
                            {status === 'capturing' ? 'Matching' : 'Ready'}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white/85">Face inside frame</div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute left-4 top-4 rounded-2xl border border-white/10 bg-slate-950/72 px-4 py-3 text-white shadow-xl backdrop-blur">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/70">Prompt</div>
                      <div className="mt-1 text-sm font-bold text-white">
                        {status === 'counting' ? 'Hold still' : status === 'capturing' ? 'Verifying face' : 'Center your face'}
                      </div>
                    </div>
                    {status === 'counting' && (
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-slate-950/80 border-4 border-amber-300 rounded-full flex items-center justify-center mb-3 mx-auto shadow-2xl">
                            <span className="text-4xl font-bold text-white">{countdown}</span>
                          </div>
                          <p className="text-amber-100 font-bold text-xs uppercase tracking-[0.2em]">Auto capture</p>
                          {locationStatus === 'success' && <p className="text-green-300 text-xs mt-1">Location verified</p>}
                        </div>
                      </div>
                    )}
                    {status === 'capturing' && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl border-4 border-cyan-200 border-t-transparent animate-spin" />
                          <p className="text-white font-bold text-base">Verifying face</p>
                          <p className="text-white/80 text-xs sm:text-sm mt-1">
                            Attempt {attempts + 1}/{maxAttempts}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="hidden min-h-0 rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur lg:flex lg:flex-col">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100/60 mb-2">Live guidance</div>
                    <p className="text-white text-xl font-bold leading-snug mb-4">
                      {status === 'counting' ? `Capturing in ${countdown} seconds...` : 'Position your face within the green frame'}
                    </p>
                    {status === 'idle' && (
                      <div className="text-slate-200 text-xs grid gap-2">
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                          <BulbOutlined className="mr-1" />
                          <span>Good lighting</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                          <WarningOutlined className="mr-1" />
                          <span>No sunglasses</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                          <UserOutlined className="mr-1" />
                          <span>Look at camera</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                          <ScanOutlined className="mr-1" />
                          <span>Fill the frame</span>
                        </div>
                      </div>
                    )}
                    <div className="mt-auto rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-amber-100">
                        <WarningOutlined />
                        Keep face visible
                      </div>
                      <p className="mt-1 text-xs leading-5 text-amber-100/75">Avoid strong backlight and do not move during capture.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-Confirm Modal */}
      {autoConfirmModal && pendingAttendance && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
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
                    const fallback = autoConfirmFallbackImage || '/default-avatar.png';
                    img.src = fallback;
                  }}
                />
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  {pendingAttendance.recognized_employee?.name || pendingAttendance.employee_name}
                </h4>
                <p className="text-gray-600 text-sm">{pendingAttendance.recognized_employee?.code || pendingAttendance.employee_code}</p>
                {userLocation && (
                  <div className="bg-blue-50 rounded-lg p-3 mt-3">
                    <div className="flex items-center justify-center text-blue-700 text-xs mb-1">
                      <EnvironmentOutlined className="mr-1" />
                      {userLocation.officeCheck.isInOffice ? '🏢 Office' : '🌍 Remote'}
                    </div>
                    <p className="text-blue-600 text-xs">{userLocation.officeCheck.distance}m from office center</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleNotMe}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-3 px-6 rounded-xl font-semibold text-base transition-all hover:scale-105 shadow-lg"
              >
                ❌ It's Not Me — Cancel
              </button>
              <p className="text-gray-400 text-xs text-center mt-4">Attendance will be confirmed automatically if this is correct.</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {successData && !suppressSuccessUIRef.current && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircleOutlined className="text-green-500 text-3xl" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                {successData.action === 'check-in' ? 'Checked In! 🎉' : 'Checked Out! 👋'}
              </h4>
              <p className="text-gray-600 text-base mb-4">
                Attendance recorded for <strong className="text-gray-800">{successData.employeeName}</strong>
              </p>
              <p className="text-gray-500 text-sm mb-2">
                Code: <strong className="text-gray-700">{successData.employeeCode}</strong>
              </p>
              {userLocation && (
                <div className="bg-blue-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-center text-blue-700 text-xs mb-1">
                    <EnvironmentOutlined className="mr-1" />
                    {userLocation.officeCheck.isInOffice ? '🏢 Office Location' : '🌍 Remote Location'}
                  </div>
                  <p className="text-blue-600 text-xs">Location verified</p>
                </div>
              )}
              <div className="text-gray-400 text-xs mb-4">Closes automatically in 4 seconds</div>
              <button
                onClick={handleSuccessClose}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-6 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Request Modal */}
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


