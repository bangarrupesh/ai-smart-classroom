import React, { useState, useEffect, useRef } from 'react';
import { Quiz, User, Submission, SharedContent, GeneratedLecture, CaseStudy, FAQ, AttendanceSession, AttendanceRecord } from '../types';
import { LogoutIcon, BookOpenIcon, CheckCircleIcon, HomeIcon, QuizIcon, VisualizationIcon, ShareIcon, FileTextIcon, ImageIcon, SummarizeIcon, TranslateIcon, SpeakerIcon, CloseIcon, EyeIcon, HelpCircleIcon, UserCheckIcon, FileSpreadsheetIcon } from './Icons';
import Sidebar from './Sidebar';
import { summarizeText, translateText, analyzeImageContent, getExplanation } from '../services/geminiService';
import SmartSearch from './SmartSearch';

// Extend the Window interface to include global libraries
declare global {
  interface Window {
    mammoth: any;
    XLSX: any;
    pdfjsLib: any;
    pptx: any;
  }
}

interface StudentPortalProps {
  quizzes: Quiz[];
  onLogout: () => void;
  user: User;
  addSubmission: (submission: Submission) => void;
  studentSubmissions: Submission[];
  sharedContent: SharedContent[];
  generatedLectures: GeneratedLecture[];
  generatedCaseStudies: CaseStudy[];
  faqs: FAQ[];
  attendanceSessions: AttendanceSession[];
  addAttendanceRecord: (record: AttendanceRecord) => void;
}

// Sub-components for pages
const HomePage: React.FC<{ 
  user: User, 
  quizzes: Quiz[], 
  userSubmissions: Submission[], 
  sharedContent: SharedContent[],
  onStartQuiz: (quiz: Quiz) => void
}> = ({ user, quizzes, userSubmissions, sharedContent, onStartQuiz }) => {
  const completedQuizIds = new Set(userSubmissions.map(s => s.quizId));
  const availableQuizzes = quizzes.filter(q => !completedQuizIds.has(q.id));
  const nextQuiz = availableQuizzes[0];
  const recentContent = sharedContent.slice(0, 3);

  const totalPossibleScore = userSubmissions.reduce((acc, s) => acc + s.totalQuestions, 0);
  const totalScore = userSubmissions.reduce((acc, s) => acc + s.score, 0);
  const averageScore = totalPossibleScore > 0 ? ((totalScore / totalPossibleScore) * 100).toFixed(0) : 0;
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Welcome back, {user.name}!</h2>
        <p className="text-gray-400">Ready to learn something new today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Available Quizzes" value={availableQuizzes.length} />
        <StatCard title="Completed Quizzes" value={userSubmissions.length} />
        <StatCard title="Overall Score" value={`${averageScore}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 h-full">
            <h3 className="text-2xl font-bold mb-4">Up Next</h3>
            {nextQuiz ? (
              <div className="bg-brand-dark p-4 rounded-lg">
                <p className="text-sm text-gray-400">Next Quiz</p>
                <h4 className="text-xl font-bold my-2">{nextQuiz.topic}</h4>
                <p className="text-sm text-gray-400 mb-4">{nextQuiz.questions.length} questions</p>
                <button 
                  onClick={() => onStartQuiz(nextQuiz)}
                  className="w-full bg-brand-cyan text-white font-bold py-3 rounded-lg hover:bg-cyan-500 transition-colors"
                >
                  Start Quiz
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <CheckCircleIcon />
                  <p className="font-semibold mt-2">You've completed all available quizzes!</p>
                  <p className="text-sm text-gray-400">Great job!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 h-full">
            <h3 className="text-2xl font-bold mb-4">Recently Added Content</h3>
            {recentContent.length > 0 ? (
              <div className="space-y-3">
                {recentContent.map(item => (
                  <div key={item.id} className="bg-brand-dark p-3 rounded-md flex items-center gap-3">
                     {item.type === 'image' ? <ImageIcon/> : <FileTextIcon/>}
                     <div>
                       <p className="font-semibold">{item.title}</p>
                       <p className="text-xs text-gray-400">{item.description}</p>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No new content has been shared.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
};

const StatCard: React.FC<{ title: string, value: string | number }> = ({ title, value }) => (
    <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
);


const AttendancePage: React.FC<{
  user: User;
  activeSession: AttendanceSession | undefined;
  sessions: AttendanceSession[];
  onMarkPresent: (record: AttendanceRecord) => void;
}> = ({ user, activeSession, sessions, onMarkPresent }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const alreadyMarked = activeSession?.records.some(r => r.studentName === user.name) ?? false;
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure permissions are granted.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [showCamera]);

  const handleTakePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      setCapturedImage(canvas.toDataURL('image/png'));
      setShowCamera(false);
    }
  };

  const handleConfirmAttendance = () => {
    setIsVerifying(true);
    // Simulate face recognition
    setTimeout(() => {
      setIsVerifying(false);
      onMarkPresent({ studentName: user.name, timestamp: new Date().toISOString() });
      setCapturedImage(null);
    }, 2000);
  };
  
  const personalHistory = sessions.filter(s => s.records.some(r => r.studentName === user.name))
                                 .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
        <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg rounded-lg mb-4"></video>
        <div className="flex gap-4">
          <button onClick={() => setShowCamera(false)} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
          <button onClick={handleTakePicture} className="bg-brand-cyan text-white font-bold py-2 px-4 rounded-lg">Take Picture</button>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
        <img src={capturedImage} alt="Captured for attendance" className="w-full max-w-lg rounded-lg mb-4"/>
        <div className="flex gap-4">
          <button onClick={() => setCapturedImage(null)} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg" disabled={isVerifying}>Retake</button>
          <button onClick={handleConfirmAttendance} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2" disabled={isVerifying}>
             {isVerifying ? (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                </>
            ) : "Confirm"}
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Attendance Check-in</h2>
        {activeSession ? (
          alreadyMarked ? (
             <div className="text-center">
                <CheckCircleIcon />
                <h3 className="text-xl font-bold text-green-400">You are marked present for today!</h3>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 mb-4">An attendance session is currently active.</p>
              <button onClick={() => setShowCamera(true)} className="bg-brand-cyan text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500">
                Mark Attendance
              </button>
            </div>
          )
        ) : (
          <p className="text-gray-500 text-center">No active attendance session at the moment.</p>
        )}
      </div>

      <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">My Attendance History</h2>
        <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
            {personalHistory.length > 0 ? (
                personalHistory.map(session => (
                    <div key={session.id} className="bg-brand-dark p-3 rounded-md flex justify-between items-center">
                        <span>{new Date(session.date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="text-green-400 font-semibold">Present</span>
                    </div>
                ))
            ) : (
                <p className="text-gray-500">You have no attendance records yet.</p>
            )}
        </div>
      </div>
    </div>
  );
};


const QuizzesPage: React.FC<{
  availableQuizzes: Quiz[],
  completedQuizzes: Quiz[],
  userSubmissions: Submission[],
  quizResult: { score: number; total: number } | null,
  onStartQuiz: (quiz: Quiz) => void
}> = ({ availableQuizzes, completedQuizzes, userSubmissions, quizResult, onStartQuiz }) => (
  <div className="space-y-8">
    {quizResult && (
      <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8 text-center">
        <CheckCircleIcon />
        <h2 className="text-2xl font-bold text-green-400">Quiz Completed!</h2>
        <p className="text-4xl mt-4">Your Score: {quizResult.score} / {quizResult.total}</p>
      </div>
    )}

    {/* Available Quizzes */}
    <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-4">Available Quizzes</h2>
      {availableQuizzes.length === 0 ? (
        <p className="text-gray-400">No new quizzes available. Check back later!</p>
      ) : (
        <div className="space-y-4">
          {availableQuizzes.map((quiz) => (
            <div key={quiz.id} className="flex justify-between items-center bg-brand-dark p-4 rounded-md">
              <div>
                <h3 className="text-xl font-semibold">{quiz.topic}</h3>
                <p className="text-gray-400">{quiz.questions.length} Questions</p>
              </div>
              <button
                onClick={() => onStartQuiz(quiz)}
                className="bg-brand-cyan text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-500 transition-colors duration-300 flex items-center gap-2"
              >
                <BookOpenIcon /> Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Completed Quizzes */}
    <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Completed Quizzes</h2>
        {completedQuizzes.length === 0 ? (
            <p className="text-gray-400">You haven't completed any quizzes yet.</p>
        ) : (
            <div className="space-y-4">
                {completedQuizzes.map((quiz) => {
                    const submission = userSubmissions.find(s => s.quizId === quiz.id);
                    return (
                        <div key={quiz.id} className="flex justify-between items-center bg-brand-dark p-4 rounded-md opacity-70">
                            <div>
                                <h3 className="text-xl font-semibold">{quiz.topic}</h3>
                                <p className="text-gray-400">{quiz.questions.length} Questions</p>
                            </div>
                            {submission && (
                                <div className="text-right">
                                    <p className="font-bold text-lg">{submission.score} / {submission.totalQuestions}</p>
                                    <p className="text-xs text-gray-500">Completed</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  </div>
);

const AnalysisPage: React.FC<{ submissions: Submission[], quizzes: Quiz[] }> = ({ submissions, quizzes }) => {
  if (submissions.length === 0) {
    return (
      <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">No Quiz History Found</h2>
        <p className="text-gray-400">Your performance analysis will appear here after you complete your first quiz.</p>
      </div>
    );
  }

  const totalQuizzesTaken = submissions.length;
  const totalScore = submissions.reduce((acc, sub) => acc + sub.score, 0);
  const totalPossibleScore = submissions.reduce((acc, sub) => acc + sub.totalQuestions, 0);
  const averagePercentage = totalPossibleScore > 0 ? ((totalScore / totalPossibleScore) * 100).toFixed(1) : 0;

  const getQuizTopic = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz ? quiz.topic : 'Unknown Quiz';
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
        <div className="bg-brand-dark p-6 rounded-lg">
            <p className="text-sm text-gray-400">Total Quizzes Taken</p>
            <p className="text-4xl font-bold mt-2">{totalQuizzesTaken}</p>
        </div>
        <div className="bg-brand-dark p-6 rounded-lg">
            <p className="text-sm text-gray-400">Overall Average Score</p>
            <p className="text-4xl font-bold mt-2">{averagePercentage}%</p>
        </div>
      </div>

      <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
        <h3 className="text-2xl font-bold mb-6">Quiz History</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-brand-dark">
                    <tr>
                        <th className="p-4">Quiz Topic</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Percentage</th>
                        <th className="p-4">Date Completed</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((sub, index) => {
                        const percentage = ((sub.score / sub.totalQuestions) * 100).toFixed(0);
                        return (
                            <tr key={index} className="border-b border-brand-border">
                                <td className="p-4 font-semibold">{getQuizTopic(sub.quizId)}</td>
                                <td className="p-4">{sub.score} / {sub.totalQuestions}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                                        <div className="bg-brand-cyan h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <span className="w-12 text-right">{percentage}%</span>
                                  </div>
                                </td>
                                <td className="p-4 text-sm text-gray-400">{new Date(sub.submittedAt).toLocaleString()}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};


const SharedContentPage: React.FC<{ content: SharedContent[] }> = ({ content }) => {
    const [activeContent, setActiveContent] = useState<SharedContent | null>(null);
    const [viewingContent, setViewingContent] = useState<SharedContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [aiResult, setAiResult] = useState<{title: string, text: string} | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFileRendering, setIsFileRendering] = useState(false);
    const [docHtml, setDocHtml] = useState<string | null>(null);
    const [pdfDoc, setPdfDoc] = useState<any | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const pptxContainerRef = useRef<HTMLDivElement>(null);
    const pdfCanvasRef = useRef<HTMLCanvasElement>(null);

    // Effect for rendering Office files and PDFs
    useEffect(() => {
        setDocHtml(null);
        setPdfDoc(null);
        if (pptxContainerRef.current) pptxContainerRef.current.innerHTML = '';
    
        if (!viewingContent || viewingContent.type !== 'file' || !viewingContent.fileData) return;
    
        const mimeType = viewingContent.mimeType;
        const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const isPptx = mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        const isXlsx = mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const isPdf = mimeType === 'application/pdf';

        const base64ToArrayBuffer = (base64: string): Uint8Array => {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        };

        if (isDocx || isPptx || isXlsx) {
            const renderOfficeFile = async () => {
                setIsFileRendering(true);
                try {
                    const base64String = viewingContent.fileData!.substring(viewingContent.fileData!.indexOf(',') + 1);
                    const bytes = base64ToArrayBuffer(base64String);

                    if (isDocx) {
                        const result = await window.mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
                        setDocHtml(result.value);
                    } else if (isPptx) {
                        if (pptxContainerRef.current) {
                            if (window.pptx && typeof window.pptx.render === 'function') {
                                window.pptx.render(bytes.buffer, pptxContainerRef.current);
                            } else {
                                setDocHtml(`<p class="text-red-500 p-4">The presentation viewer is still loading. Please close this and try again in a moment.</p>`);
                            }
                        }
                    } else if (isXlsx) {
                        const workbook = window.XLSX.read(bytes, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const html = window.XLSX.utils.sheet_to_html(worksheet);
                        const styledHtml = `<div class="p-4 prose prose-invert max-w-none"><style>
                            table { width: 100%; border-collapse: collapse; }
                            th, td { border: 1px solid #374151; padding: 8px; text-align: left; }
                            th { background-color: #1F2937; }
                        </style>${html}</div>`;
                        setDocHtml(styledHtml);
                    }
                } catch (error) {
                    console.error("Error rendering document:", error);
                    setDocHtml(`<p class="text-red-500 p-4">Sorry, an error occurred while trying to render this file.</p>`);
                } finally {
                    setIsFileRendering(false);
                }
            };
            renderOfficeFile();
        } else if (isPdf) {
            const renderPdf = async () => {
                setIsFileRendering(true);
                try {
                    if (!window.pdfjsLib) {
                        setDocHtml(`<p class="text-red-500 p-4">The PDF viewer is still loading. Please close this and try again in a moment.</p>`);
                        setIsFileRendering(false);
                        return;
                    }
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`;
                    const base64String = viewingContent.fileData!.substring(viewingContent.fileData!.indexOf(',') + 1);
                    const pdfData = base64ToArrayBuffer(base64String);
                    const doc = await window.pdfjsLib.getDocument({ data: pdfData }).promise;
                    setPdfDoc(doc);
                    setPageNum(1);
                } catch (error: any) {
                    console.error('Error loading PDF:', error);
                    setDocHtml(`<p class="text-red-500 p-4">Error loading PDF: ${error.message}</p>`);
                    setIsFileRendering(false); // Ensure loading stops on error
                }
            };
            renderPdf();
        }
    
        return () => {
            if (pptxContainerRef.current) pptxContainerRef.current.innerHTML = '';
        }
    }, [viewingContent]);

    // Effect for rendering a specific PDF page
    useEffect(() => {
        if (!pdfDoc || !pdfCanvasRef.current) return;
    
        const renderPage = async () => {
            setIsFileRendering(true);
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = pdfCanvasRef.current!;
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
    
                const renderContext = { canvasContext: context, viewport: viewport };
                await page.render(renderContext).promise;
            } catch (error) {
                console.error("Error rendering PDF page:", error);
            } finally {
                setIsFileRendering(false);
            }
        };
        renderPage();
    }, [pdfDoc, pageNum]);

    const handleCloseModal = () => {
        setActiveContent(null);
        setAiResult(null);
        setError(null);
        window.speechSynthesis.cancel();
    }

    const handleCloseViewModal = () => {
        setViewingContent(null);
        setPdfDoc(null);
    }

    const getContentText = async (item: SharedContent): Promise<string> => {
        if (item.type === 'text') {
            return item.content ?? item.description ?? '';
        }
        if (item.type === 'image' && item.fileData && item.mimeType) {
            const base64 = item.fileData.split(',')[1];
            return await analyzeImageContent(base64, item.mimeType);
        }
        if (item.type === 'file' && item.fileData && item.mimeType) {
            try {
                const base64String = item.fileData.substring(item.fileData.indexOf(',') + 1);
                const binaryString = atob(base64String);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const arrayBuffer = bytes.buffer;

                if (item.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const result = await window.mammoth.extractRawText({ arrayBuffer });
                    return result.value;
                }
                
                if (item.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                    const workbook = window.XLSX.read(bytes, { type: 'array' });
                    let fullText = '';
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                        jsonData.forEach(row => {
                            fullText += row.join(' \t ') + '\n';
                        });
                    });
                    return fullText;
                }
            } catch (error) {
                console.error('Error extracting text from file:', error);
                return `Error extracting content from ${item.fileName}. Using description instead. ${item.description || ''}`;
            }
        }
        return item.description || 'Content not available for AI processing.';
    };

    const handleSummarize = async (item: SharedContent) => {
        setActiveContent(item);
        setIsLoading(true);
        setError(null);
        try {
            const text = await getContentText(item);
            if (!text) throw new Error("Could not extract any text to summarize.");
            const summary = await summarizeText(text);
            setAiResult({title: 'Summary', text: summary});
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleTranslate = async (item: SharedContent, language: string) => {
        setActiveContent(item);
        setIsLoading(true);
        setError(null);
        try {
            const text = await getContentText(item);
            if (!text) throw new Error("Could not extract any text to translate.");
            const translation = await translateText(text, language);
            setAiResult({title: `Translation (${language})`, text: translation});
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Your browser does not support text-to-speech.");
        }
    };
    
    const getFileIcon = (item: SharedContent) => {
        if (item.type === 'image') return <ImageIcon/>;
        if (item.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return <FileSpreadsheetIcon />;
        return <FileTextIcon/>;
    };

    return (
        <>
            <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">File Information</h2>
                {content.length === 0 ? (
                    <p className="text-gray-500">Your teacher hasn't shared any content yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {content.map(item => (
                            <div key={item.id} className="bg-brand-dark rounded-lg p-4 flex flex-col">
                                <div className="flex items-start gap-3 mb-2 flex-grow">
                                    {getFileIcon(item)}
                                    <div>
                                        <h3 className="font-bold">{item.title}</h3>
                                        <p className="text-sm text-gray-400">{item.description}</p>
                                    </div>
                                </div>
                                
                                {item.type === 'image' && item.fileData && (
                                    <div className="my-2 h-40 bg-brand-dark-blue rounded-md flex items-center justify-center overflow-hidden">
                                        <img src={item.fileData} alt={item.title} className="h-full w-full object-cover"/>
                                    </div>
                                )}
                                
                                <div className="mt-auto pt-4 border-t border-brand-border space-y-3">
                                    <button onClick={() => setViewingContent(item)} className="w-full flex items-center justify-center gap-2 bg-brand-dark-blue text-white font-semibold py-2 px-3 rounded-lg hover:bg-brand-border transition-colors">
                                        <EyeIcon/> View
                                    </button>
                                    <div className="pt-1">
                                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 text-center">AI Tools</h4>
                                      <div className="flex flex-wrap gap-2 justify-center">
                                          <button onClick={() => handleSummarize(item)} className="flex items-center gap-1 text-xs bg-brand-dark-blue px-2 py-1 rounded-md hover:bg-brand-border"><SummarizeIcon/> Summarize</button>
                                          <div className="group relative">
                                              <button className="flex items-center gap-1 text-xs bg-brand-dark-blue px-2 py-1 rounded-md hover:bg-brand-border"><TranslateIcon/> Translate</button>
                                              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-start bg-brand-dark-blue border border-brand-border p-1 rounded-md z-10">
                                                  <button onClick={() => handleTranslate(item, 'Spanish')} className="w-full text-left text-xs px-2 py-1 hover:bg-brand-dark rounded">Spanish</button>
                                                  <button onClick={() => handleTranslate(item, 'French')} className="w-full text-left text-xs px-2 py-1 hover:bg-brand-dark rounded">French</button>
                                                  <button onClick={() => handleTranslate(item, 'German')} className="w-full text-left text-xs px-2 py-1 hover:bg-brand-dark rounded">German</button>
                                                  <button onClick={() => handleTranslate(item, 'Marathi')} className="w-full text-left text-xs px-2 py-1 hover:bg-brand-dark rounded">Marathi</button>
                                                  <button onClick={() => handleTranslate(item, 'Hindi')} className="w-full text-left text-xs px-2 py-1 hover:bg-brand-dark rounded">Hindi</button>
                                                  <button onClick={() => handleTranslate(item, 'English')} className="w-full text-left text-xs px-2 py-1 hover:bg-brand-dark rounded">English</button>
                                              </div>
                                          </div>
                                      </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* AI Results Modal */}
            {activeContent && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-2xl font-bold text-brand-cyan">{aiResult?.title || 'Processing...'}</h3>
                             <button onClick={handleCloseModal}><CloseIcon/></button>
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2">
                            {isLoading && <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div></div>}
                            {error && <p className="text-red-500">{error}</p>}
                            {aiResult && <p className="whitespace-pre-wrap text-gray-300">{aiResult.text}</p>}
                        </div>
                        {aiResult && (
                           <div className="mt-4 pt-4 border-t border-brand-border">
                               <button onClick={() => handleSpeak(aiResult.text)} className="w-full bg-brand-cyan text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-500 flex items-center justify-center gap-2">
                                   <SpeakerIcon/> Read Aloud
                               </button>
                           </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* View Content Modal */}
            {viewingContent && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-brand-cyan">{viewingContent.title}</h3>
                            <button onClick={handleCloseViewModal}><CloseIcon/></button>
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2 bg-brand-dark rounded-md">
                            {isFileRendering && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                                    <p className="ml-4">Rendering file, please wait...</p>
                                </div>
                            )}
                            {viewingContent.type === 'text' && (
                                <p className="whitespace-pre-wrap text-gray-300 p-4">{viewingContent.content}</p>
                            )}
                            {viewingContent.type === 'image' && viewingContent.fileData && (
                                <div className="flex justify-center items-center h-full p-4">
                                  <img src={viewingContent.fileData} alt={viewingContent.title} className="max-w-full max-h-full object-contain"/>
                                </div>
                            )}
                            {viewingContent.type === 'file' && viewingContent.fileData && viewingContent.mimeType && (
                                (() => {
                                    const mimeType = viewingContent.mimeType;
                                    if (mimeType === 'application/pdf') {
                                        return (
                                            <div className={`flex flex-col items-center h-full ${pdfDoc && !isFileRendering ? 'flex' : 'hidden'}`}>
                                                <div className="flex-grow w-full flex items-center justify-center overflow-auto">
                                                    <canvas ref={pdfCanvasRef}></canvas>
                                                </div>
                                                {pdfDoc && (
                                                    <div className="flex items-center justify-center gap-4 p-2 bg-brand-dark-blue border-t border-brand-border w-full flex-shrink-0">
                                                        <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1} className="px-4 py-1 bg-brand-dark rounded disabled:opacity-50">Previous</button>
                                                        <span>Page {pageNum} of {pdfDoc.numPages}</span>
                                                        <button onClick={() => setPageNum(p => Math.min(pdfDoc.numPages, p + 1))} disabled={pageNum >= pdfDoc.numPages} className="px-4 py-1 bg-brand-dark rounded disabled:opacity-50">Next</button>
                                                    </div>
                                                )}
                                                {docHtml && <div className="p-4" dangerouslySetInnerHTML={{ __html: docHtml }} />}
                                            </div>
                                        );
                                    }
                                    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                                        return (
                                            <div className={`prose-h1:text-white prose-h2:text-white prose-h3:text-white prose-p:text-gray-300 prose-strong:text-white max-w-none ${isFileRendering ? 'hidden' : ''}`}>
                                                <div dangerouslySetInnerHTML={{ __html: docHtml || '' }} />
                                            </div>
                                        );
                                    }
                                    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                                        return (
                                            <div className={`h-full ${isFileRendering ? 'hidden' : ''}`}>
                                               <div ref={pptxContainerRef} className="w-full h-full" />
                                                {docHtml && <div dangerouslySetInnerHTML={{ __html: docHtml }} />}
                                            </div>
                                        );
                                    }
                                    // Fallback for other file types
                                    if (!isFileRendering && !pdfDoc && !docHtml) {
                                      return (
                                          <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                                              <p className="text-gray-400 mb-6">This file type cannot be previewed directly.</p>
                                              <a href={viewingContent.fileData} download={viewingContent.fileName} className="bg-brand-cyan text-white font-semibold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors duration-300 inline-flex items-center gap-2">
                                                  <FileTextIcon/> Download {viewingContent.fileName}
                                              </a>
                                          </div>
                                      );
                                    }
                                    return null;
                                })()
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const DoubtSolverPage: React.FC = () => {
    const [conversation, setConversation] = useState<Message[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    const handleSubmitQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentQuestion.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: currentQuestion };
        setConversation(prev => [...prev, userMessage]);
        setCurrentQuestion('');
        setIsLoading(true);
        setError(null);

        try {
            const explanation = await getExplanation(userMessage.text);
            const aiMessage: Message = { sender: 'ai', text: explanation };
            setConversation(prev => [...prev, aiMessage]);
        } catch (err: any) {
            const errorMessage: Message = { sender: 'ai', text: `Sorry, I encountered an error: ${err.message}` };
            setConversation(prev => [...prev, errorMessage]);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 flex flex-col h-[75vh]">
            <h2 className="text-2xl font-bold mb-4">AI Teaching Assistant</h2>
            <div className="flex-grow overflow-y-auto pr-4 space-y-4 mb-4">
                {conversation.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-lg ${msg.sender === 'user' ? 'bg-brand-light-blue text-white' : 'bg-brand-dark'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="max-w-xl p-3 rounded-lg bg-brand-dark flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                         </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSubmitQuestion} className="flex gap-4 border-t border-brand-border pt-4">
                <textarea
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Ask a question about a concept..."
                    className="flex-grow bg-brand-dark border border-brand-border rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none resize-none"
                    rows={2}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !currentQuestion.trim()}
                    className="bg-brand-cyan text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-500 transition-colors duration-300 disabled:bg-cyan-800 disabled:cursor-not-allowed self-stretch"
                >
                    Ask
                </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-2 text-center">Failed to get response. Please try again.</p>}
        </div>
    );
};

const StudentPortal: React.FC<StudentPortalProps> = ({ 
    quizzes, 
    onLogout, 
    user, 
    addSubmission, 
    studentSubmissions, 
    sharedContent,
    generatedLectures,
    generatedCaseStudies,
    faqs,
    attendanceSessions,
    addAttendanceRecord
}) => {
  const [activePage, setActivePage] = useState('home');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);

  const navItems = [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'quizzes', label: 'Quizzes', icon: <QuizIcon /> },
    { id: 'file-information', label: 'File Information', icon: <ShareIcon /> },
    { id: 'attendance', label: 'Attendance', icon: <UserCheckIcon /> },
    { id: 'analysis', label: 'Analysis', icon: <VisualizationIcon /> },
    { id: 'doubt-solver', label: 'Doubt Solver', icon: <HelpCircleIcon /> },
  ];

  const userSubmissions = studentSubmissions.filter(sub => sub.studentName === user.name);
  const knowledgeBase = { quizzes, lectures: generatedLectures, caseStudies: generatedCaseStudies, sharedContent, faqs };
  const activeAttendanceSession = attendanceSessions.find(s => s.isActive);

  const completedQuizIds = new Set(userSubmissions.map(s => s.quizId));
  const availableQuizzes = quizzes.filter(q => !completedQuizIds.has(q.id));
  const completedQuizzes = quizzes.filter(q => completedQuizIds.has(q.id));

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizResult(null);
  };

  const handleQuizComplete = (score: number, total: number) => {
    setQuizResult({ score, total });
    if (activeQuiz && user.classCode) {
        addSubmission({
            quizId: activeQuiz.id,
            studentName: user.name,
            score: score,
            totalQuestions: total,
            classCode: user.classCode,
            submittedAt: new Date().toISOString()
        });
    }
    setActiveQuiz(null);
    setActivePage('quizzes'); // Go back to the quizzes page to show result
  };

  if (activeQuiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <QuizTaker quiz={activeQuiz} onComplete={handleQuizComplete} />
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        title={<>Student<br/>Dashboard</>}
        navItems={navItems}
      />
      <div className="flex-1 ml-64">
        <div className="p-8 max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-8 gap-8">
            <h1 className="text-4xl font-bold text-brand-cyan capitalize whitespace-nowrap">{activePage.replace('-', ' ')}</h1>
            <SmartSearch knowledgeBase={knowledgeBase} />
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-sm bg-brand-dark px-3 py-1 rounded-full border border-brand-border">Class: {user.classCode}</span>
              <span className="text-gray-400">Welcome, {user.name}</span>
              <button onClick={onLogout} className="flex items-center gap-2 text-brand-cyan hover:underline">
                <LogoutIcon />
                Logout
              </button>
            </div>
          </header>
          <main>
            {activePage === 'home' && <HomePage 
              user={user}
              quizzes={quizzes}
              userSubmissions={userSubmissions}
              sharedContent={sharedContent}
              onStartQuiz={handleStartQuiz}
            />}
            {activePage === 'quizzes' && <QuizzesPage 
              availableQuizzes={availableQuizzes} 
              completedQuizzes={completedQuizzes}
              userSubmissions={userSubmissions}
              quizResult={quizResult} 
              onStartQuiz={handleStartQuiz} 
            />}
            {activePage === 'analysis' && <AnalysisPage submissions={userSubmissions} quizzes={quizzes} />}
            {activePage === 'file-information' && <SharedContentPage content={sharedContent} />}
            {activePage === 'doubt-solver' && <DoubtSolverPage />}
            {activePage === 'attendance' && <AttendancePage user={user} activeSession={activeAttendanceSession} sessions={attendanceSessions} onMarkPresent={addAttendanceRecord} />}
          </main>
        </div>
      </div>
    </div>
  );
};

const QuizTaker: React.FC<{ quiz: Quiz; onComplete: (score: number, total: number) => void }> = ({ quiz, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = () => {
    let score = 0;
    quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswerIndex) {
        score++;
      }
    });
    onComplete(score, quiz.questions.length);
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center text-brand-cyan">{quiz.topic}</h1>
        <p className="text-center text-gray-400 mb-8">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>

        <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
            <p className="text-xl font-semibold mb-6">{currentQuestion.questionText}</p>
            <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleSelectAnswer(index)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors duration-200 ${
                            selectedAnswers[currentQuestionIndex] === index
                                ? 'bg-brand-cyan border-cyan-300 text-white'
                                : 'bg-brand-dark border-brand-border hover:border-brand-cyan'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <div className="mt-8 flex justify-end">
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <button onClick={handleNext} className="bg-brand-cyan text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-500">
                        Next
                    </button>
                ) : (
                    <button onClick={handleSubmit} className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700">
                        Submit Quiz
                    </button>
                )}
            </div>
        </div>
    </div>
  )
};


export default StudentPortal;