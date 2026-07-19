import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Card, Form, Input, DatePicker, Row, Col, Modal, Typography, Steps, Progress, message, Tag, Checkbox } from 'antd';
import {
  CameraOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  SoundOutlined,
  AudioMutedOutlined
} from '@ant-design/icons';
import Webcam from 'react-webcam';
import dayjs from 'dayjs';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';
import useAuth from 'hooks/useAuth';

const { Title, Text } = Typography;
const { Step } = Steps;

const EmployeeRegistration = ({
  onClose,
  onRegisterSuccess,
  existingData
}: {
  onClose: () => void;
  onRegisterSuccess: () => void;
  existingData?: any;
}) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const companyCode = user?.company_code?.toUpperCase() || localStorage.getItem('company_code')?.toUpperCase() || '';
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [captureInstruction, setCaptureInstruction] = useState('center');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const webcamRef = useRef<Webcam>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const [autoCaptureInterval, setAutoCaptureInterval] = useState<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [faceAngles, setFaceAngles] = useState<string[]>([]);
  const [setDebugInfo] = useState<any | null>(null);

  // Employee profile returned from API
  const [employeeProfile, setEmployeeProfile] = useState<any | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  //const [isBTIndia, setIsBTIndia] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Voice feedback function
  const speak = useCallback(
    (text: string) => {
      if (!isVoiceEnabled || !speechSynthRef.current) return;

      speechSynthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      const voices = speechSynthRef.current.getVoices();
      const femaleVoice = voices.find(
        (voice) => voice.name.includes('Female') || voice.name.includes('Karen') || voice.name.includes('Samantha')
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      speechSynthRef.current.speak(utterance);
    },
    [isVoiceEnabled]
  );

  // Toggle voice feature
  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled((prev) => !prev);
    if (!isVoiceEnabled) {
      speak('Voice guidance enabled');
    }
  }, [isVoiceEnabled, speak]);

  const detectFaceAngle = useCallback((imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const brightnessFallback = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('center');
            return;
          }
          ctx.drawImage(img, 0, 0);
          const width = canvas.width;
          const height = canvas.height;
          const regionY = Math.floor(height * 0.3);
          const regionH = Math.max(1, Math.floor(height * 0.4));
          const leftW = Math.max(1, Math.floor(width * 0.33));
          const centerW = Math.max(1, Math.floor(width * 0.34));
          const rightX = leftW + centerW;
          const leftRegion = ctx.getImageData(0, regionY, leftW, regionH);
          const centerRegion = ctx.getImageData(leftW, regionY, centerW, regionH);
          const rightRegion = ctx.getImageData(rightX, regionY, leftW, regionH);
          const getAverageBrightness = (imageData: ImageData) => {
            let total = 0;
            const pixels = imageData.data.length / 4;
            for (let i = 0; i < imageData.data.length; i += 4) {
              const r = imageData.data[i];
              const g = imageData.data[i + 1];
              const b = imageData.data[i + 2];
              total += (r + g + b) / 3;
            }
            return pixels > 0 ? total / pixels : 0;
          };
          const leftBrightness = getAverageBrightness(leftRegion);
          const centerBrightness = getAverageBrightness(centerRegion);
          const rightBrightness = getAverageBrightness(rightRegion);
          const safeCenter = Math.max(1, centerBrightness);
          const leftDiffRatio = Math.abs(leftBrightness - centerBrightness) / safeCenter;
          const rightDiffRatio = Math.abs(rightBrightness - centerBrightness) / safeCenter;
          const REL_THRESHOLD = 0.12;
          if (leftDiffRatio < REL_THRESHOLD && rightDiffRatio < REL_THRESHOLD) {
            resolve('center');
            return;
          }
          if (leftBrightness > rightBrightness && leftBrightness > centerBrightness) {
            resolve('right');
          } else if (rightBrightness > leftBrightness && rightBrightness > centerBrightness) {
            resolve('left');
          } else {
            resolve('center');
          }
        };
        img.onerror = () => resolve('center');
        img.src = imageSrc;
      };

      (async () => {
        try {
          const faceapi: any = await import('face-api.js');

          const loadModels = async () => {
            try {
              await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
              await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
              return true;
            } catch (err) {
              const CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
              try {
                await faceapi.nets.tinyFaceDetector.loadFromUri(CDN);
                await faceapi.nets.faceLandmark68Net.loadFromUri(CDN);
                return true;
              } catch (err2) {
                return false;
              }
            }
          };

          const ok = await loadModels();
          if (!ok) {
            brightnessFallback();
            return;
          }

          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = async () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve('center');
                return;
              }
              ctx.drawImage(img, 0, 0);

              const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
              const detection = await faceapi.detectSingleFace(canvas, options).withFaceLandmarks();
              if (!detection || !detection.landmarks) {
                brightnessFallback();
                return;
              }

              const landmarks = detection.landmarks as any;
              const leftEye = landmarks.getLeftEye();
              const rightEye = landmarks.getRightEye();
              const nose = landmarks.getNose();

              const avgX = (pts: any[]) => pts.reduce((s, p) => s + p.x, 0) / pts.length;
              const leftEyeX = avgX(leftEye);
              const rightEyeX = avgX(rightEye);
              const noseX = avgX(nose);
              const eyeCenterX = (leftEyeX + rightEyeX) / 2;

              const imageMirrored = leftEyeX > rightEyeX;
              const eyeSpan = Math.max(1, Math.abs(rightEyeX - leftEyeX));

              let normalized = (noseX - eyeCenterX) / eyeSpan;
              if (imageMirrored) normalized = -normalized;

              let ratio = (noseX - leftEyeX) / eyeSpan;
              if (imageMirrored) ratio = 1 - ratio;

              console.debug('face-api detect:', { leftEyeX, rightEyeX, noseX, imageMirrored, normalized, ratio });
              try {
                setDebugInfo({ leftEyeX, rightEyeX, noseX, imageMirrored, normalized, ratio });
              } catch (e) {}

              const NORM_THRESHOLD = 0.07;
              const RATIO_LEFT = 0.44;
              const RATIO_RIGHT = 0.56;

              let result = 'center';
              if (Math.abs(normalized) < NORM_THRESHOLD && ratio > RATIO_LEFT && ratio < RATIO_RIGHT) {
                result = 'center';
              } else if (normalized > NORM_THRESHOLD || ratio > RATIO_RIGHT) {
                result = 'right';
              } else {
                result = 'left';
              }

              try {
                setDebugInfo({ leftEyeX, rightEyeX, noseX, imageMirrored, normalized, ratio, detectedAngle: result });
              } catch (e) {}
              resolve(result);
            } catch (e) {
              brightnessFallback();
            }
          };
          img.onerror = () => brightnessFallback();
          img.src = imageSrc;
        } catch (err) {
          brightnessFallback();
        }
      })();
    });
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (existingData) {
      const formattedData = {
        employee_code: existingData.employee_code || existingData.EMPLOYEE_CODE || '',
        employee_id: existingData.employee_id || existingData.EMPLOYEE_ID || '',
        full_name: existingData.full_name || existingData.RPT_NAME || '',
        email: existingData.email || existingData.EMAIL_PERSONAL || '',
        phone_number: existingData.phone_number || existingData.MOBILE_NO || '',
        department: existingData.department || existingData.DEPT_NAME || '',
        position: existingData.position || existingData.DESG_NAME || existingData.DESG_CODE || '',
        hire_date: existingData.hire_date ? dayjs(existingData.hire_date) : existingData.JOIN_DATE ? dayjs(existingData.JOIN_DATE) : null
      };
      form.setFieldsValue(formattedData);
      if (existingData.EMPLOYEE_CODE || existingData.RPT_NAME) {
        setEmployeeProfile(existingData);
        setValidationStatus('success');
      }
    }
  }, [existingData, form]);

  // Auto capture photos with countdown and voice
  const startAutoCapture = () => {
    setPhotos([]);
    setFaceAngles([]);
    setCaptureInstruction('center');
    setIsCameraOpen(true);
    setCountdown(3);

    speak('Starting automatic face capture. Please position your face in the frame.');

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startCaptureSequence();
          return 0;
        }
        if (prev <= 3) {
          speak(prev.toString());
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCaptureSequence = () => {
    let captureCount = 0;

    const captureNext = () => {
      if (captureCount < 3) {
        setCountdown(5);

        if (captureCount === 0) {
          speak('Look straight at the camera. Capturing in 5 seconds');
        } else if (captureCount === 1) {
          speak('Now turn your head to the right. Capturing in 5 seconds');
        } else if (captureCount === 2) {
          speak('Now turn your head to the left. Capturing in 5 seconds');
        }

        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);

              (async () => {
                try {
                  const ok = await capturePhoto();
                  if (ok) captureCount++;
                } catch (e) {}

                if (captureCount < 3) {
                  setTimeout(captureNext, 500);
                } else {
                  setAutoCaptureInterval(null);
                  setCaptureInstruction('done');
                  speak('All face images captured successfully! You can now complete the registration.');
                  setTimeout(() => setIsCameraOpen(false), 1000);
                }
              })();

              return 0;
            }
            if (prev <= 3) {
              speak(prev.toString());
            }
            return prev - 1;
          });
        }, 1000);
      }
    };

    captureNext();
  };

  const capturePhoto = useCallback(async (): Promise<boolean> => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      message.error('Failed to capture image, please try again.');
      speak('Failed to capture image. Please try again.');
      return false;
    }
    try {
      const detectedAngle = await detectFaceAngle(imageSrc);
      const expectedAngle = captureInstruction;

      console.debug('capture check:', { expectedAngle, detectedAngle });
      if (process.env.NODE_ENV !== 'production') {
        try {
          message.info(`Detected: ${detectedAngle} · Expected: ${expectedAngle}`, 1.2);
        } catch (e) {}
      }

      if (detectedAngle !== expectedAngle) {
        let warnMessage = '';
        if (expectedAngle === 'center') {
          warnMessage = 'Warning: first photo expected straight, but detected differently. Saving anyway.';
        } else if (expectedAngle === 'right') {
          if (detectedAngle === 'center') warnMessage = 'Warning: expected RIGHT but detected STRAIGHT. Saving anyway.';
          else if (detectedAngle === 'left') warnMessage = 'Warning: expected RIGHT but detected LEFT. Saving anyway.';
        } else if (expectedAngle === 'left') {
          if (detectedAngle === 'center') warnMessage = 'Warning: expected LEFT but detected STRAIGHT. Saving anyway.';
          else if (detectedAngle === 'right') warnMessage = 'Warning: expected LEFT but detected RIGHT. Saving anyway.';
        }

        if (warnMessage) {
          message.warning(warnMessage);
          speak(warnMessage);
        }
      }

      if (faceAngles.includes(detectedAngle)) {
        const duplicateMessage = `Note: you've already captured a ${detectedAngle} angle. Saving duplicate.`;
        message.info(duplicateMessage);
        speak(duplicateMessage);
      }

      setPhotos((prev) => [...prev, imageSrc]);
      setFaceAngles((prev) => [...prev, detectedAngle]);

      if (captureInstruction === 'center') {
        setCaptureInstruction('right');
        speak('Straight face captured successfully!');
        message.success('Straight face captured!');
      } else if (captureInstruction === 'right') {
        setCaptureInstruction('left');
        speak('Right face captured successfully!');
        message.success('Right face captured!');
      } else if (captureInstruction === 'left') {
        setCaptureInstruction('done');
        speak('Left face captured successfully! All images captured.');
        message.success('Left face captured! All images captured successfully');
      }

      return true;
    } catch (e) {
      message.error('Failed to analyze the photo. Please try again.');
      speak('Failed to analyze the photo. Please try again.');
      return false;
    }
  }, [webcamRef, captureInstruction, faceAngles, detectFaceAngle, speak]);

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setFaceAngles((prev) => prev.filter((_, i) => i !== index));

    if (index === 0) setCaptureInstruction('center');
    else if (index === 1) setCaptureInstruction('right');
    else setCaptureInstruction('left');

    speak('Photo removed. Please recapture the image.');
  };

  const openCamera = () => {
    setPhotos([]);
    setFaceAngles([]);
    setCaptureInstruction('center');
    setCountdown(0);
    setIsCameraOpen(true);
    speak('Manual camera mode opened. Position your face and click capture when ready.');
  };

  const handleCameraClose = () => {
    if (autoCaptureInterval) {
      clearInterval(autoCaptureInterval);
      setAutoCaptureInterval(null);
    }
    setCountdown(0);
    setIsCameraOpen(false);
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
  };

  const validateEmployeeCode = async () => {
    const code = form.getFieldValue('employee_code')?.trim();
    if (!code) {
      message.error('Please enter Employee Code to validate.');
      speak('Please enter employee code to validate.');
      return;
    }

    try {
      setValidateLoading(true);
      setValidationStatus('validating');
      speak('Validating employee code. Please wait.');

      // let data;
      // if (isBTIndia) {
      //   data = await attendanceServiceInstance.getEmployeeInfobt(code);
      // } else {
      //   data = await attendanceServiceInstance.getEmployeeInfo(code);
      // }

      if (!companyCode) {
        message.error('Session expired. Please login again.');
        speak('Session expired. Please login again.');
        return;
      }

      let data;
      switch (companyCode) {
        case 'BTIND':
          data = await attendanceServiceInstance.getEmployeeInfobt(code);
          break;
        default:
          data = await attendanceServiceInstance.getEmployeeInfo(code);
      }

      if (Array.isArray(data)) {
        if (data.length === 0) {
          setEmployeeProfile(null);
          setValidationStatus('error');
          speak('Employee code not found. Please check and try again.');
          message.error('Employee code not found');
          return;
        }
        data = data[0];
      }

      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        setEmployeeProfile(null);
        setValidationStatus('error');
        speak('Employee code not found. Please check and try again.');
        message.error('Employee code not found');
        return;
      }

      const formData = {
        employee_code: data.EMPLOYEE_CODE || code,
        employee_id: data.EMPLOYEE_ID || '',
        full_name: data.RPT_NAME || data.PASSPORT_NAME || '',
        email: data.EMAIL_PERSONAL || '',
        phone_number: data.MOBILE_NO || '',
        department: data.DEPT_NAME || data.SECTION_NAME || '',
        position: data.DESG_NAME || data.DESG_CODE || '',
        hire_date: data.JOIN_DATE ? dayjs(data.JOIN_DATE) : null
      };

      form.setFieldsValue(formData);
      setEmployeeProfile(data);
      setValidationStatus('success');

      const employeeName = data.RPT_NAME || data.PASSPORT_NAME || 'Employee';
      speak(`Employee code validated successfully! Welcome ${employeeName}. Moving to next step.`);

      setTimeout(() => {
        if (currentStep === 0) {
          handleStepChange('next');
        }
      }, 500);
    } catch (error: any) {
      console.error('Validate error:', error);
      setEmployeeProfile(null);
      setValidationStatus('error');
      speak('Error validating employee code. Please try again.');
      message.error(error?.message || 'Failed to fetch employee information');
    } finally {
      setValidateLoading(false);
    }
  };

  const handleEmployeeCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (manualEntry) return; // Skip auto-validation in manual mode

    const code = e.target.value?.trim();
    if (code && code.length > 3 && !employeeProfile && validationStatus !== 'success') {
      setTimeout(() => {
        validateEmployeeCode();
      }, 500);
    }
  };

  // Toggle manual entry
  const handleManualEntryToggle = (checked: boolean) => {
    setManualEntry(checked);
    if (checked) {
      form.resetFields();
      form.setFieldsValue({ hire_date: dayjs() });
      setValidationStatus('idle');
      setEmployeeProfile(null);
      speak('Manual entry mode enabled. You can now enter employee details manually.');
    } else {
      form.resetFields();
      setValidationStatus('idle');
      setEmployeeProfile(null);
      speak('Validation mode enabled. Please enter employee code to validate.');
    }
  };

  const handleStepChange = async (direction: 'next' | 'prev') => {
    if (direction === 'prev') {
      setCurrentStep(currentStep - 1);
      speak('Moving to previous step.');
      return;
    }

    try {
      const stepFields = currentStep === 0 ? ['employee_code', 'full_name', 'employee_id'] : currentStep === 1 ? ['hire_date'] : [];

      if (stepFields.length > 0) {
        await form.validateFields(stepFields);
      }

      setCurrentStep(currentStep + 1);

      if (currentStep === 0) {
        speak('Personal information completed. Now please fill in work details.');
      } else if (currentStep === 1) {
        speak('Work details completed. Now proceed to face capture.');
      }
    } catch (error) {
      speak('Please complete all required fields before proceeding.');
      message.error('Please complete all required fields before proceeding.');
    }
  };

  const onFinish = async (values: any) => {
    console.log('Final form values:', values);

    if (!existingData && photos.length < 3) {
      speak('Please capture all three required face photos before completing registration.');
      message.error('Please capture all required face photos.');
      return;
    }

    try {
      setLoading(true);
      speak('Processing registration. Please wait...');

      const formData = new FormData();

      let hireDateFormatted = '';
      if (values.hire_date) {
        if (dayjs.isDayjs(values.hire_date)) {
          hireDateFormatted = values.hire_date.format('YYYY-MM-DD');
        } else if (typeof values.hire_date === 'string') {
          hireDateFormatted = values.hire_date;
        } else {
          hireDateFormatted = dayjs(values.hire_date).format('YYYY-MM-DD');
        }
      }

      formData.append('employee_code', values.employee_code || '');
      if (existingData?.employee_id) {
        formData.append('employee_id', existingData.employee_id);
      } else if (values.employee_id) {
        formData.append('employee_id', values.employee_id);
      }

      formData.append('full_name', values.full_name);

      if (values.email) formData.append('email', values.email);
      if (values.department) formData.append('department', values.department);
      if (values.position) formData.append('position', values.position);
      if (hireDateFormatted) formData.append('hire_date', hireDateFormatted);
      if (values.phone_number) formData.append('phone_number', values.phone_number);

      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const blob = await fetch(photos[i]).then((r) => r.blob());
          formData.append('images', blob, `face_${i}.jpg`);
        }
      }

      if (existingData) {
        await attendanceServiceInstance.modifyEmployee(existingData.employee_id, formData);
        speak('Employee information updated successfully!');
        message.success('Employee updated successfully!');
      } else {
        await attendanceServiceInstance.registerEmployee(formData);
        speak('Employee registration completed successfully! Welcome to the team.');
      }

      onRegisterSuccess();
      onClose();
    } catch (error: any) {
      console.error('Registration error in onFinish:', error);
      speak('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: 'user'
  };

  const FaceShapeOverlay = ({ instruction }: { instruction: string }) => {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            width: 200,
            height: 250,
            border: '3px solid rgba(255, 255, 255, 0.8)',
            borderRadius: '45%',
            position: 'relative',
            background: 'transparent',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '25%',
              width: 20,
              height: 10,
              border: '2px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '50%'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '30%',
              right: '25%',
              width: 20,
              height: 10,
              border: '2px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '50%'
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: '25%',
              left: '35%',
              width: 60,
              height: 20,
              borderBottom: '2px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '0 0 30px 30px'
            }}
          />

          {instruction === 'right' && (
            <div
              style={{
                position: 'absolute',
                top: '40%',
                right: '-52px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                background: 'rgba(8,42,137,0.85)',
                borderRadius: 999,
                padding: '4px 10px'
              }}
            >
              Right
            </div>
          )}
          {instruction === 'left' && (
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '-44px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                background: 'rgba(8,42,137,0.85)',
                borderRadius: 999,
                padding: '4px 10px'
              }}
            >
              Left
            </div>
          )}
        </div>
      </div>
    );
  };

  const getInstructionText = () => {
    if (countdown > 0) {
      return `Next capture in ${countdown}s...`;
    }

    switch (captureInstruction) {
      case 'center':
        return 'Look straight at the camera';
      case 'right':
        return 'Turn your head to the right';
      case 'left':
        return 'Turn your head to the left';
      case 'done':
        return 'All images captured';
      default:
        return 'Position your face in the frame';
    }
  };

  const renderStepContent = (step: number) => {
    const style = currentStep === step ? {} : { display: 'none' };

    switch (step) {
      case 0:
        return (
          <div style={style}>
            {/* Voice Control */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <div>
                <Text strong>Manual Entry Mode: </Text>
                <Checkbox checked={manualEntry} onChange={(e) => handleManualEntryToggle(e.target.checked)}>
                  Enable Manual Entry
                </Checkbox>
              </div>
              <Button
                onClick={toggleVoice}
                icon={isVoiceEnabled ? <SoundOutlined /> : <AudioMutedOutlined />}
                type={isVoiceEnabled ? 'primary' : 'default'}
                size="small"
              >
                {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
              </Button>
            </div>

            {/* Employee Code Validation Card */}
            {!manualEntry && (
              <Card
                className="employee-code-card"
                style={{
                  marginBottom: 10,
                  background: validationStatus === 'success' ? '#f6ffed' : validationStatus === 'error' ? '#fff2f0' : '#fafafa',
                  border:
                    validationStatus === 'success'
                      ? '1px solid #b7eb8f'
                      : validationStatus === 'error'
                      ? '1px solid #ffccc7'
                      : '1px solid #d9d9d9'
                }}
              >
                <div className="employee-code-card__grid">
                  <Form.Item label={<Text strong>Employee Code *</Text>} style={{ marginBottom: 0 }}>
                    <div className="employee-code-card__controls">
                      <Form.Item
                        name="employee_code"
                        rules={[{ required: true, message: 'Please input Employee Code!' }]}
                        style={{ flex: 1, margin: 0, minWidth: 0 }}
                      >
                        <Input size={windowWidth >= 768 ? 'middle' : 'large'} placeholder="Enter code" onBlur={handleEmployeeCodeBlur} disabled={!!existingData} />
                      </Form.Item>

                      <Button
                        onClick={validateEmployeeCode}
                        loading={validateLoading}
                        size={windowWidth >= 768 ? 'middle' : 'large'}
                        type={validationStatus === 'success' ? 'default' : 'primary'}
                        icon={validationStatus === 'success' ? <CheckCircleOutlined /> : undefined}
                        className="employee-code-card__button"
                      >
                        {validationStatus === 'success' ? 'Validated' : 'Validate'}
                      </Button>
                    </div>
                  </Form.Item>
                  <div className="employee-code-card__status">
                    {validationStatus === 'success' && (
                      <Tag color="success" style={{ fontSize: '13px', padding: '5px 10px', marginInlineEnd: 0 }}>
                        <CheckCircleOutlined /> Validated
                      </Tag>
                    )}
                    {validationStatus === 'error' && (
                      <Tag color="error" style={{ fontSize: '13px', padding: '5px 10px', marginInlineEnd: 0 }}>
                        Invalid Code
                      </Tag>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Manual Entry - Simple Employee Code Field */}
            {manualEntry && (
              <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
                <Col xs={24}>
                  <Form.Item
                    label={<Text strong>Employee Code *</Text>}
                    name="employee_code"
                    rules={[{ required: true, message: 'Please input Employee Code!' }]}
                  >
                  <Input size={windowWidth >= 768 ? 'middle' : 'large'} placeholder="Enter employee code" />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<Text strong>Full Name *</Text>}
                  name="full_name"
                  rules={[{ required: true, message: 'Please input Full Name!' }]}
                >
                  <Input size={windowWidth >= 768 ? 'middle' : 'large'} placeholder="Enter full name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<Text strong>Employee ID *</Text>}
                  name="employee_id"
                  rules={[{ required: true, message: 'Employee ID is required!' }]}
                >
                  <Input size={windowWidth >= 768 ? 'middle' : 'large'} placeholder={manualEntry ? 'Enter employee ID' : 'Auto-filled from system'} readOnly={!manualEntry} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={<Text strong>Email</Text>} name="email">
                  <Input size={windowWidth >= 768 ? 'middle' : 'large'} placeholder="employee@company.com" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={<Text strong>Phone Number</Text>} name="phone_number">
                  <Input size={windowWidth >= 768 ? 'middle' : 'large'} placeholder="Phone Number" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );
      case 1:
        return (
          <div style={style}>
            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <Form.Item label={<Text strong>Department</Text>} name="department">
                  <Input size={windowWidth >= 768 ? 'middle' : 'large'} placeholder="Enter department" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={<Text strong>Position</Text>} name="position">
                  <Input size={windowWidth >= 768 ? 'middle' : 'large'} placeholder="Enter job position" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<Text strong>Hire Date *</Text>}
                  name="hire_date"
                  rules={[{ required: true, message: 'Please select hire date!' }]}
                >
                  <DatePicker style={{ width: '100%' }} size={windowWidth >= 768 ? 'middle' : 'large'} format="YYYY-MM-DD" placeholder="Select Hire Date" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );
      case 2:
        return (
          <div style={style}>
            <div style={{ textAlign: 'center', marginBottom: windowWidth >= 768 ? 12 : 18 }}>
              <CameraOutlined style={{ fontSize: windowWidth >= 768 ? 32 : 42, color: '#082a89', marginBottom: 6 }} />
              <Title level={4} style={{ marginBottom: 4, color: '#082a89' }}>
                Face Capture
              </Title>
              <Text type="secondary">Capture straight, right, and left face views.</Text>
              {isVoiceEnabled && (
                <div style={{ marginTop: 8 }}>
                  <SoundOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                  <Text type="success" style={{ fontSize: '12px' }}>
                    Voice guidance active
                  </Text>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginBottom: windowWidth >= 768 ? 14 : 20 }}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                <Button
                  type="primary"
                  size={windowWidth >= 768 ? 'middle' : 'large'}
                  icon={<CameraOutlined />}
                  onClick={startAutoCapture}
                  style={{ borderRadius: 8, height: windowWidth >= 768 ? 38 : 46, padding: '0 18px', background: '#082a89' }}
                >
                  Auto Capture (15s)
                </Button>
                <Button
                  size={windowWidth >= 768 ? 'middle' : 'large'}
                  icon={<CameraOutlined />}
                  onClick={openCamera}
                  style={{ borderRadius: 8, height: windowWidth >= 768 ? 38 : 46, padding: '0 18px' }}
                >
                  Manual Capture
                </Button>
              </div>

              {photos.length > 0 && (
                <div>
                  <Progress
                    percent={Math.min(100, (photos.length / 3) * 100)}
                    status={photos.length >= 3 ? 'success' : 'active'}
                    style={{ maxWidth: 400, margin: '0 auto 8px' }}
                  />
                  <Text type={photos.length >= 3 ? 'success' : undefined} strong>
                    {photos.length} of 3 images captured
                    {photos.length >= 3 && ' - Ready to Register!'}
                  </Text>
                </div>
              )}
            </div>

            {photos.length > 0 && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  Captured Images:
                </Text>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      windowWidth <= 768 ? 'repeat(auto-fit, minmax(100px, 1fr))' : 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 10
                  }}
                >
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        border: '2px solid #e8e8e8',
                        borderRadius: 6,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Face ${index + 1}`}
                        style={{
                          width: '100%',
                          height: windowWidth >= 768 ? 84 : 104,
                          objectFit: 'cover'
                        }}
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        size="small"
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2
                        }}
                        onClick={() => removePhoto(index)}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          textAlign: 'center',
                          fontSize: 11,
                          padding: 2
                        }}
                      >
                        {faceAngles[index]
                          ? `${faceAngles[index].charAt(0).toUpperCase() + faceAngles[index].slice(1)} done`
                          : index === 0
                          ? 'Straight'
                          : index === 1
                          ? 'Right'
                          : 'Left'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const isMobileForm = windowWidth < 640;
  const isTabletForm = windowWidth >= 640 && windowWidth < 1024;

  return (
    <div
      className="employee-registration-modern"
      style={{
        maxWidth: windowWidth >= 1024 ? 1040 : '100%',
        margin: '0 auto',
        padding: isMobileForm ? 0 : '8px',
        background: isMobileForm ? 'transparent' : '#f4f7fb',
        position: 'relative',
        zIndex: 1,
        height: isMobileForm ? 'calc(100dvh - 112px)' : windowWidth >= 768 ? 'calc(100vh - 165px)' : 'auto',
        maxHeight: isMobileForm ? 'calc(100dvh - 112px)' : windowWidth >= 768 ? 'calc(100vh - 165px)' : 'none',
        overflow: 'hidden'
      }}
    >
      <style>
        {`
          .employee-registration-modern,
          .employee-registration-modern * {
            box-sizing: border-box;
          }
          .employee-registration-modern .ant-form-item {
            margin-bottom: ${windowWidth >= 768 ? '10px' : '12px'};
          }
          .employee-registration-modern .ant-form-item-label {
            padding-bottom: 3px;
          }
          .employee-registration-modern .ant-form-item-label > label {
            color: #101828;
            font-size: ${isMobileForm ? '13px' : '14px'};
            line-height: 1.2;
          }
          .employee-registration-modern .ant-input,
          .employee-registration-modern .ant-picker,
          .employee-registration-modern .ant-btn {
            border-radius: 10px;
          }
          .employee-registration-modern .ant-input-lg,
          .employee-registration-modern .ant-picker-large {
            height: ${windowWidth >= 768 ? '38px' : '46px'};
            font-size: ${isMobileForm ? '15px' : '14px'};
          }
          .employee-registration-modern .ant-input::placeholder {
            color: #667085;
            text-overflow: ellipsis;
          }
          .employee-registration-modern .ant-card-body {
            height: 100%;
          }
          .employee-registration-modern .ant-steps {
            padding: ${isMobileForm ? '4px 0 2px' : '0'};
          }
          .employee-registration-modern .ant-steps-item-title {
            font-size: ${isMobileForm ? '0' : isTabletForm ? '12px' : '14px'} !important;
          }
          .employee-registration-modern .ant-steps-item-icon {
            ${isMobileForm ? 'margin-inline-start: 0;' : ''}
          }
          .employee-code-card .ant-card-body {
            padding: ${isMobileForm ? '14px' : '16px'};
          }
          .employee-code-card__grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 12px;
            align-items: end;
          }
          .employee-code-card__controls {
            display: flex;
            gap: 10px;
            align-items: center;
            min-width: 0;
          }
          .employee-code-card__button {
            min-width: 116px;
            height: ${windowWidth >= 768 ? '38px' : '46px'};
            font-weight: 600;
          }
          .employee-code-card__status {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            min-height: 34px;
          }
          .employee-registration-content {
            flex: 1;
            min-height: 0;
            overflow-x: hidden;
            overflow-y: ${isMobileForm ? 'auto' : windowWidth >= 768 ? 'hidden' : 'auto'};
            padding: ${isMobileForm ? '0 2px 12px' : '0'};
            scrollbar-width: thin;
          }
          .employee-registration-actions {
            position: ${isMobileForm ? 'sticky' : 'static'};
            bottom: 0;
            z-index: 2;
            margin: ${isMobileForm ? '4px -2px -2px' : '12px 0 0'};
            padding: ${isMobileForm ? '10px 2px 0' : '0'};
            background: ${isMobileForm ? 'linear-gradient(180deg, rgba(255,255,255,0), #fff 26%)' : 'transparent'};
          }
          @media (max-width: 639px) {
            .employee-registration-modern .ant-row {
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            .employee-registration-modern .ant-col {
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            .employee-registration-modern .ant-card {
              border-radius: 16px !important;
            }
            .employee-code-card__grid {
              grid-template-columns: 1fr;
              gap: 8px;
            }
            .employee-code-card__controls {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 8px;
            }
            .employee-code-card__button {
              min-width: 104px;
              padding-inline: 12px;
            }
            .employee-code-card__status {
              justify-content: flex-start;
              min-height: 0;
            }
          }
        `}
      </style>
      <Card
        style={{
          height: '100%',
          borderRadius: isMobileForm ? 16 : 12,
          boxShadow: '0 10px 30px rgba(8,42,137,0.08)',
          border: '1px solid #dbeafe',
          overflow: 'hidden'
        }}
        bodyStyle={{
          padding: isMobileForm ? '12px' : '14px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: isMobileForm ? 8 : windowWidth >= 768 ? 10 : 16, flexShrink: 0 }}>
          <Title level={4} style={{ color: '#082a89', marginBottom: 2, fontSize: isMobileForm ? '18px' : windowWidth <= 768 ? '18px' : '20px' }}>
            {existingData ? 'Edit Employee' : 'Register New Employee'}
          </Title>
          <Text type="secondary" style={{ fontSize: isMobileForm ? '12px' : '13px' }}>
            {existingData ? 'Update employee information' : 'Complete the form to register a new employee'}
          </Text>
        </div>

        <Steps
          current={currentStep}
          style={{
            marginBottom: isMobileForm ? 10 : windowWidth >= 768 ? 14 : 18,
            flexShrink: 0
          }}
          size="small"
          responsive={false}
        >
          <Step title="Personal Info" />
          <Step title="Work Details" />
          <Step title="Face Capture" />
        </Steps>

        <Form form={form} layout="vertical" onFinish={onFinish} style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'column' }}>
          <div className="employee-registration-content">
            {renderStepContent(0)}
            {renderStepContent(1)}
            {renderStepContent(2)}
          </div>

          <div
            className="employee-registration-actions"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10
            }}
          >
            <Button size={isMobileForm ? 'large' : 'middle'} disabled={currentStep === 0} onClick={() => handleStepChange('prev')} style={{ flex: 1, maxWidth: isMobileForm ? 'none' : 120, height: isMobileForm ? 44 : undefined }}>
              <ArrowLeftOutlined /> Previous
            </Button>

            {currentStep < 2 ? (
              <Button type="primary" size={isMobileForm ? 'large' : 'middle'} onClick={() => handleStepChange('next')} style={{ flex: 1, maxWidth: isMobileForm ? 'none' : 120, background: '#082a89', height: isMobileForm ? 44 : undefined }}>
                Next <ArrowRightOutlined />
              </Button>
            ) : (
              <Button
                type="primary"
                size={isMobileForm ? 'large' : 'middle'}
                onClick={() => form.submit()}
                loading={loading}
                disabled={!existingData && photos.length < 3}
                style={{ flex: 1, maxWidth: isMobileForm ? 'none' : 180, background: '#082a89', height: isMobileForm ? 44 : undefined }}
              >
                {existingData ? 'Update Employee' : 'Complete Registration'}
              </Button>
            )}
          </div>
        </Form>
      </Card>

      {/* Camera Modal */}
      <Modal
        getContainer={() => document.body}
        zIndex={15000}
        open={isCameraOpen}
        onCancel={handleCameraClose}
        footer={null}
        width={Math.min(560, windowWidth - 24)}
        centered
        style={{ top: 20 }}
        bodyStyle={{
          padding: 0,
          overflow: 'hidden',
          borderRadius: 10
        }}
        maskStyle={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
      >
        <div style={{ position: 'relative' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            style={{ width: '100%', height: windowWidth >= 768 ? 360 : 320, display: 'block', objectFit: 'cover' }}
            mirrored
          />

          <FaceShapeOverlay instruction={captureInstruction} />

          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: 10,
              borderRadius: 6,
              textAlign: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{getInstructionText()}</Text>
            {isVoiceEnabled && (
              <div style={{ marginTop: 4 }}>
                <SoundOutlined style={{ color: '#52c41a', fontSize: '12px', marginRight: 4 }} />
                <Text style={{ color: '#52c41a', fontSize: '12px' }}>Voice Active</Text>
              </div>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 12
            }}
          >
            <Button size={windowWidth >= 768 ? 'middle' : 'large'} onClick={handleCameraClose}>
              Cancel
            </Button>
            {!autoCaptureInterval && countdown === 0 && (
              <Button type="primary" size={windowWidth >= 768 ? 'middle' : 'large'} icon={<CameraOutlined />} onClick={capturePhoto} disabled={captureInstruction === 'done'} style={{ background: '#082a89' }}>
                Manual Capture
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeRegistration;


