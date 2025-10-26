import React, { useState, useEffect } from 'react';
import { AccessibilitySettings, Role, User, Quiz, Submission, SharedContent, GeneratedLecture, CaseStudy, FAQ, AttendanceSession, AttendanceRecord, Classroom } from './types';
import RoleSelection from './components/RoleSelection';
import Auth from './components/Auth';
import TeacherPortal from './components/TeacherPortal';
import StudentPortal from './components/StudentPortal';
import AccessibilityEnhancer from './components/AccessibilityEnhancer';
import JoinClass from './components/JoinClass';

const App: React.FC = () => {
  const faqsData: FAQ[] = [
    {
      question: "How do I generate a quiz?",
      answer: "As a teacher, navigate to the 'Quiz Generation' tab. You can either enter a topic manually or select a previously generated lecture to create a quiz from."
    },
    {
      question: "Where can I see my quiz results?",
      answer: "As a student, after completing a quiz, your results will be shown immediately. You can view your full history and performance analytics on the 'Analysis' page."
    },
    {
      question: "How do I share a file with students?",
      answer: "In the Teacher Dashboard, go to the 'Shared Content' page. You can upload files, images, or share text-based content using the form provided."
    },
    {
      question: "How do I find my class code?",
      answer: "As a teacher, your unique class code is displayed prominently on your dashboard's Home page. Share this with your students so they can join."
    }
  ];

  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<Submission[]>([]);
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
  const [generatedLectures, setGeneratedLectures] = useState<GeneratedLecture[]>([]);
  const [generatedCaseStudies, setGeneratedCaseStudies] = useState<CaseStudy[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>(faqsData);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    fontSize: 16,
    highContrast: false,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
      }
    }
    const storedAllUsers = localStorage.getItem('allUsers');
    if(storedAllUsers) setAllUsers(JSON.parse(storedAllUsers));

    const storedClassrooms = localStorage.getItem('classrooms');
    if(storedClassrooms) setClassrooms(JSON.parse(storedClassrooms));

  }, []);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const generateClassCode = () => {
    // Keep generating until we find a unique code
    while (true) {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        if (!classrooms.some(c => c.code === newCode)) {
            return newCode;
        }
    }
  };

  const handleAuthSuccess = (authData: { name: string, email: string }) => {
    if (selectedRole) {
      const existingUser = allUsers.find(u => u.email === authData.email);

      if (existingUser) { // Login
        if (existingUser.role !== selectedRole) {
            alert(`You have already registered as a ${existingUser.role}. Please log in with the correct role.`);
            return;
        }
        setUser(existingUser);
        localStorage.setItem('user', JSON.stringify(existingUser));
        setSelectedRole(null);
        return;
      }
      
      // Signup
      let newUser: User = { name: authData.name, email: authData.email, role: selectedRole };
      
      if (selectedRole === 'teacher') {
          const newClassCode = generateClassCode();
          newUser.classCode = newClassCode;
          const newClassroom: Classroom = {
              code: newClassCode,
              teacherEmail: authData.email
          };
          const updatedClassrooms = [...classrooms, newClassroom];
          setClassrooms(updatedClassrooms);
          localStorage.setItem('classrooms', JSON.stringify(updatedClassrooms));
      }

      const updatedUsers = [...allUsers, newUser];
      setAllUsers(updatedUsers);
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));

      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      setSelectedRole(null);
    }
  };

  const handleJoinClass = (classCode: string) => {
    if (user && classrooms.some(c => c.code === classCode)) {
        const updatedUser: User = { ...user, classCode };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        const updatedUsers = allUsers.map(u => u.email === user.email ? updatedUser : u);
        setAllUsers(updatedUsers);
        localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
    } else {
        throw new Error("Invalid Class Code");
    }
  };

  const handleBackToRoleSelect = () => {
    setSelectedRole(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setSelectedRole(null);
  };
  
  const handleAddQuiz = (quiz: Quiz) => {
    setQuizzes(prevQuizzes => [...prevQuizzes, quiz]);
  };

  const handleUpdateQuiz = (updatedQuiz: Quiz) => {
    setQuizzes(quizzes.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes(quizzes.filter(q => q.id !== quizId));
  };

  const handleAddSubmission = (submission: Submission) => {
    const newSubmission = { ...submission, submittedAt: new Date().toISOString() };
    setStudentSubmissions(prev => [...prev, newSubmission]);
  };

  const handleAddSharedContent = (content: SharedContent) => {
    const newContent = { ...content, id: new Date().toISOString() };
    setSharedContent(prev => [newContent, ...prev]);
  };

  const handleUpdateSharedContent = (updatedContent: SharedContent) => {
    setSharedContent(sharedContent.map(c => c.id === updatedContent.id ? updatedContent : c));
  };

  const handleDeleteSharedContent = (contentId: string) => {
    setSharedContent(sharedContent.filter(c => c.id !== contentId));
  };

  const handleAddGeneratedLecture = (lecture: GeneratedLecture) => {
    setGeneratedLectures(prev => [...prev, lecture]);
  };
  
  const handleAddGeneratedCaseStudy = (study: CaseStudy) => {
    setGeneratedCaseStudies(prev => [...prev, study]);
  };

  const handleStartAttendanceSession = () => {
    if (!user?.classCode) return;
    const today = new Date().toISOString().split('T')[0];
    const classCode = user.classCode;

    setAttendanceSessions(prev => {
      const updatedSessions = prev.map(s => ({...s, isActive: s.classCode === classCode ? false : s.isActive}));
      const existingSession = updatedSessions.find(s => s.date === today && s.classCode === classCode);
      if (existingSession) {
        existingSession.isActive = true;
        return [...updatedSessions.filter(s => s.id !== existingSession.id), existingSession];
      }
      
      const newSession: AttendanceSession = {
        id: new Date().toISOString(),
        date: today,
        isActive: true,
        records: [],
        classCode: classCode,
      };
      return [...updatedSessions, newSession];
    });
  };

  const handleStopAttendanceSession = () => {
    if (!user?.classCode) return;
    setAttendanceSessions(prev => prev.map(s => (s.isActive && s.classCode === user.classCode) ? {...s, isActive: false} : s));
  };

  const handleAddAttendanceRecord = (record: AttendanceRecord) => {
    if (!user?.classCode) return;
    const classCode = user.classCode;
    setAttendanceSessions(prev => prev.map(s => {
      if (s.isActive && s.classCode === classCode && !s.records.some(r => r.studentName === record.studentName)) {
        return {...s, records: [...s.records, record]};
      }
      return s;
    }));
  };

  const renderContent = () => {
    if (user) {
      if (user.role === 'student' && !user.classCode) {
        return <JoinClass user={user} onJoinClass={handleJoinClass} onLogout={handleLogout} classrooms={classrooms} />;
      }

      const userClassCode = user.classCode;
      if (!userClassCode) {
         // This state should ideally not be reachable for teachers, but as a safeguard:
        return <div>Error: No classroom assigned. Please <button onClick={handleLogout} className="underline">log out</button> and try again.</div>;
      }
      
      const classContent = {
        quizzes: quizzes.filter(q => q.classCode === userClassCode),
        studentSubmissions: studentSubmissions.filter(s => s.classCode === userClassCode),
        sharedContent: sharedContent.filter(sc => sc.classCode === userClassCode),
        generatedLectures: generatedLectures.filter(gl => gl.classCode === userClassCode),
        generatedCaseStudies: generatedCaseStudies.filter(cs => cs.classCode === userClassCode),
        attendanceSessions: attendanceSessions.filter(as => as.classCode === userClassCode),
      };

      switch (user.role) {
        case 'teacher':
          return <TeacherPortal 
                    user={user} 
                    allUsers={allUsers}
                    onLogout={handleLogout} 
                    quizzes={classContent.quizzes}
                    addQuiz={handleAddQuiz} 
                    updateQuiz={handleUpdateQuiz}
                    deleteQuiz={handleDeleteQuiz}
                    studentSubmissions={classContent.studentSubmissions}
                    sharedContent={classContent.sharedContent}
                    addSharedContent={handleAddSharedContent}
                    updateSharedContent={handleUpdateSharedContent}
                    deleteSharedContent={handleDeleteSharedContent}
                    generatedLectures={classContent.generatedLectures}
                    addGeneratedLecture={handleAddGeneratedLecture}
                    generatedCaseStudies={classContent.generatedCaseStudies}
                    addGeneratedCaseStudy={handleAddGeneratedCaseStudy}
                    faqs={faqs}
                    attendanceSessions={classContent.attendanceSessions}
                    startAttendance={handleStartAttendanceSession}
                    stopAttendance={handleStopAttendanceSession}
                  />;
        case 'student':
          return <StudentPortal 
                    user={user} 
                    onLogout={handleLogout} 
                    quizzes={classContent.quizzes} 
                    addSubmission={handleAddSubmission}
                    studentSubmissions={classContent.studentSubmissions}
                    sharedContent={classContent.sharedContent}
                    generatedLectures={classContent.generatedLectures}
                    generatedCaseStudies={classContent.generatedCaseStudies}
                    faqs={faqs}
                    attendanceSessions={classContent.attendanceSessions}
                    addAttendanceRecord={handleAddAttendanceRecord}
                  />;
        default:
          return <RoleSelection onSelectRole={handleRoleSelect} />;
      }
    }

    if (selectedRole) {
      return <Auth role={selectedRole} onAuthSuccess={handleAuthSuccess} onBack={handleBackToRoleSelect} />;
    }

    return <RoleSelection onSelectRole={handleRoleSelect} />;
  };
  
  const highContrastClasses = accessibilitySettings.highContrast 
    ? 'bg-white text-black' 
    : 'bg-brand-dark text-gray-200';

  const isDashboardView = user && (user.role === 'teacher' || (user.role === 'student' && user.classCode));

  return (
    <div 
      className={`min-h-screen font-sans transition-colors duration-300 ${highContrastClasses}`}
      style={{ fontSize: `${accessibilitySettings.fontSize}px` }}
    >
      <main className={!isDashboardView ? "container mx-auto px-4 py-8" : ""}>
        {renderContent()}
      </main>
      <AccessibilityEnhancer 
        settings={accessibilitySettings} 
        setSettings={setAccessibilitySettings} 
      />
    </div>
  );
};

export default App;
