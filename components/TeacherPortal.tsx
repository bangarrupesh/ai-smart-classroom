import React, { useState, useCallback, useEffect } from 'react';
import { Quiz, User, Submission, SharedContent, SharedContentType, LectureSlide, CaseStudy, GeneratedLecture, FAQ, AttendanceSession } from '../types';
import { generateQuiz, generateLectureSlides, generateCaseStudy, generateQuizFromContent } from '../services/geminiService';
import { SparklesIcon, LogoutIcon, BookOpenIcon, HomeIcon, QuizIcon, VisualizationIcon, EditIcon, TrashIcon, ShareIcon, UploadIcon, FileTextIcon, ImageIcon, AIGeneratorIcon, UserCheckIcon, UsersIcon } from './Icons';
import Sidebar from './Sidebar';
import SmartSearch from './SmartSearch';

interface TeacherPortalProps {
  onLogout: () => void;
  user: User;
  allUsers: User[];
  quizzes: Quiz[];
  addQuiz: (quiz: Quiz) => void;
  updateQuiz: (quiz: Quiz) => void;
  deleteQuiz: (quizId: string) => void;
  studentSubmissions: Submission[];
  sharedContent: SharedContent[];
  addSharedContent: (content: SharedContent) => void;
  updateSharedContent: (content: SharedContent) => void;
  deleteSharedContent: (contentId: string) => void;
  generatedLectures: GeneratedLecture[];
  addGeneratedLecture: (lecture: GeneratedLecture) => void;
  generatedCaseStudies: CaseStudy[];
  addGeneratedCaseStudy: (study: CaseStudy) => void;
  faqs: FAQ[];
  attendanceSessions: AttendanceSession[];
  startAttendance: () => void;
  stopAttendance: () => void;
}

const TeacherPortal: React.FC<TeacherPortalProps> = (props) => {
  const [activePage, setActivePage] = useState('home');
  const { onLogout, user, quizzes, studentSubmissions, sharedContent, generatedLectures, generatedCaseStudies, faqs, attendanceSessions } = props;

  const navItems = [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'shared-content', label: 'Shared Content', icon: <ShareIcon /> },
    { id: 'content-generator', label: 'AI Content Generator', icon: <AIGeneratorIcon /> },
    { id: 'quiz-generation', label: 'Quiz Generation', icon: <QuizIcon /> },
    { id: 'attendance', label: 'Attendance', icon: <UserCheckIcon /> },
    { id: 'students', label: 'Students', icon: <UsersIcon /> },
    { id: 'visualization', label: 'Visualization', icon: <VisualizationIcon /> },
  ];

  const knowledgeBase = { quizzes, lectures: generatedLectures, caseStudies: generatedCaseStudies, sharedContent, faqs };
  const activeSession = attendanceSessions.find(s => s.isActive);

  return (
    <div className="flex">
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        title={<>Teacher<br/>Dashboard</>}
        navItems={navItems}
      />
      <div className="flex-1 ml-64">
        <div className="p-8 max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-8 gap-8">
            <h1 className="text-4xl font-bold text-brand-cyan capitalize whitespace-nowrap">{activePage.replace('-', ' ')}</h1>
            <SmartSearch knowledgeBase={knowledgeBase} />
            <div className="flex items-center gap-4 flex-shrink-0">
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
              allUsers={props.allUsers}
              sharedContent={sharedContent}
              activeSession={activeSession}
              onNavigate={setActivePage}
            />}
            {activePage === 'shared-content' && <SharedContentPage {...props} />}
            {activePage === 'content-generator' && <ContentGeneratorPage user={user} addGeneratedLecture={props.addGeneratedLecture} addGeneratedCaseStudy={props.addGeneratedCaseStudy} />}
            {activePage === 'quiz-generation' && <QuizGenerationPage user={user} quizzes={props.quizzes} addQuiz={props.addQuiz} updateQuiz={props.updateQuiz} deleteQuiz={props.deleteQuiz} generatedLectures={props.generatedLectures} />}
            {activePage === 'visualization' && <VisualizationPage quizzes={props.quizzes} submissions={props.studentSubmissions} />}
            {activePage === 'attendance' && <AttendancePage activeSession={activeSession} sessions={attendanceSessions} onStart={props.startAttendance} onStop={props.stopAttendance} />}
            {activePage === 'students' && <StudentsPage allUsers={props.allUsers} user={user} />}
          </main>
        </div>
      </div>
    </div>
  );
};

// Home Page Component
const HomePage: React.FC<{
  user: User;
  quizzes: Quiz[];
  allUsers: User[];
  sharedContent: SharedContent[];
  activeSession: AttendanceSession | undefined;
  onNavigate: (page: string) => void;
}> = ({ user, quizzes, allUsers, sharedContent, activeSession, onNavigate }) => {
    const totalQuizzes = quizzes.length;
    const activeStudents = allUsers.filter(u => u.role === 'student' && u.classCode === user.classCode).length;
    const totalSharedContent = sharedContent.length;
    const recentQuizzes = [...quizzes].reverse().slice(0, 3);

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h2 className="text-3xl font-bold">Welcome, {user.name}!</h2>
                <p className="text-gray-400">Here's a snapshot of your classroom activity.</p>
            </div>

            <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">Your Class Code</h3>
              <div className="bg-brand-dark p-4 rounded-md text-center">
                  <p className="text-4xl font-mono tracking-widest text-brand-cyan">{user.classCode}</p>
                  <p className="text-xs text-gray-400 mt-2">Share this code with your students to have them join your class.</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<QuizIcon />} title="Total Quizzes" value={totalQuizzes} />
                <StatCard icon={<UsersIcon />} title="Enrolled Students" value={activeStudents} />
                <StatCard icon={<ShareIcon />} title="Shared Content" value={totalSharedContent} />
                <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 flex items-center gap-4">
                    <div className="p-3 bg-brand-dark rounded-full"><UserCheckIcon /></div>
                    <div>
                        <p className="text-sm text-gray-400">Attendance</p>
                        <p className={`text-xl font-bold ${activeSession ? 'text-green-400' : 'text-red-500'}`}>{activeSession ? 'Active' : 'Inactive'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Quick Actions & Recent Activity */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <ActionCard
                                icon={<SparklesIcon/>}
                                title="Create New Quiz"
                                description="Generate a quiz on any topic with AI."
                                onClick={() => onNavigate('quiz-generation')}
                            />
                            <ActionCard
                                icon={<UploadIcon/>}
                                title="Share New Content"
                                description="Upload files, images, or notes for students."
                                onClick={() => onNavigate('shared-content')}
                            />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 h-full">
                        <h3 className="text-2xl font-bold mb-4">Recent Quizzes</h3>
                        {recentQuizzes.length > 0 ? (
                            <div className="space-y-3">
                                {recentQuizzes.map(quiz => (
                                    <div key={quiz.id} className="bg-brand-dark p-3 rounded-md">
                                        <p className="font-semibold">{quiz.topic}</p>
                                        <p className="text-xs text-gray-400">{quiz.questions.length} questions</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No quizzes have been created yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: number | string }> = ({ icon, title, value }) => (
    <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 flex items-center gap-4">
        <div className="p-3 bg-brand-dark rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const ActionCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <button onClick={onClick} className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 text-left hover:border-brand-cyan hover:shadow-glow-cyan transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
            {icon}
            <h4 className="font-bold text-lg">{title}</h4>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
    </button>
);


// Attendance Page Component
const AttendancePage: React.FC<{
  activeSession: AttendanceSession | undefined;
  sessions: AttendanceSession[];
  onStart: () => void;
  onStop: () => void;
}> = ({ activeSession, sessions, onStart, onStop }) => {
  const historicalSessions = sessions.filter(s => s.id !== activeSession?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Live Session */}
      <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Live Attendance Session</h2>
        {activeSession ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-green-400 font-semibold flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Session is Active
              </p>
              <button onClick={onStop} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">Stop Session</button>
            </div>
            <h3 className="text-xl font-semibold mb-4">Students Present ({activeSession.records.length})</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {activeSession.records.length > 0 ? (
                activeSession.records.map((record, index) => (
                  <div key={index} className="bg-brand-dark p-3 rounded-md flex justify-between items-center">
                    <span>{record.studentName}</span>
                    <span className="text-xs text-gray-400">{new Date(record.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No students have checked in yet.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 mb-4">No session is currently active.</p>
            <button onClick={onStart} className="bg-brand-cyan text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500">
              Start Today's Attendance
            </button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Attendance History</h2>
        <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
          {historicalSessions.length > 0 ? (
            historicalSessions.map(session => (
              <div key={session.id} className="bg-brand-dark p-4 rounded-md">
                <p className="font-semibold">Date: {new Date(session.date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-gray-400">{session.records.length} students were present.</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No past attendance records found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Students Page
const StudentsPage: React.FC<{ allUsers: User[]; user: User }> = ({ allUsers, user }) => {
    const enrolledStudents = allUsers.filter(u => u.role === 'student' && u.classCode === user.classCode);

    return (
        <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Enrolled Students ({enrolledStudents.length})</h2>
            {enrolledStudents.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-dark">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrolledStudents.map((student) => (
                                <tr key={student.email} className="border-b border-brand-border">
                                    <td className="p-3">{student.name}</td>
                                    <td className="p-3">{student.email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4">No students have joined your class yet.</p>
            )}
        </div>
    );
};


// Shared Content Page
const SharedContentPage: React.FC<Pick<TeacherPortalProps, 'user' | 'sharedContent' | 'addSharedContent' | 'updateSharedContent' | 'deleteSharedContent'>> = (
    { user, sharedContent, addSharedContent, updateSharedContent, deleteSharedContent }
) => {
    const [editingContent, setEditingContent] = useState<SharedContent | null>(null);

    const handleSuccess = () => {
        setEditingContent(null);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <ContentForm 
                    user={user}
                    key={editingContent?.id ?? 'new'}
                    existingContent={editingContent} 
                    onSuccess={handleSuccess}
                    addSharedContent={addSharedContent}
                    updateSharedContent={updateSharedContent}
                />
            </div>
            <div className="lg:col-span-2">
                <ContentList 
                    contentItems={sharedContent} 
                    onEdit={setEditingContent}
                    onDelete={deleteSharedContent}
                />
            </div>
        </div>
    );
};

const ContentForm: React.FC<{
    user: User,
    existingContent: SharedContent | null,
    onSuccess: () => void,
    addSharedContent: (content: SharedContent) => void,
    updateSharedContent: (content: SharedContent) => void,
}> = ({ user, existingContent, onSuccess, addSharedContent, updateSharedContent }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [contentType, setContentType] = useState<SharedContentType>('text');
    const [textContent, setTextContent] = useState('');
    const [fileData, setFileData] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string | null>(null);

    useEffect(() => {
        if (existingContent) {
            setTitle(existingContent.title);
            setDescription(existingContent.description);
            setContentType(existingContent.type);
            setTextContent(existingContent.content ?? '');
            setFileData(existingContent.fileData ?? null);
            setFileName(existingContent.fileName ?? null);
            setMimeType(existingContent.mimeType ?? null);
        }
    }, [existingContent]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setContentType('text');
        setTextContent('');
        setFileData(null);
        setFileName(null);
        setMimeType(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFileData(reader.result as string);
                setFileName(file.name);
                setMimeType(file.type);
                setContentType(file.type.startsWith('image/') ? 'image' : 'file');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user.classCode) {
          alert("Error: cannot create content without a class.");
          return;
        }

        const commonData = { title, description, classCode: user.classCode };
        let contentData: Omit<SharedContent, 'id'>;

        if (contentType === 'text') {
            contentData = { ...commonData, type: 'text', content: textContent };
        } else {
            if (!fileData) {
                alert('Please upload a file.');
                return;
            }
            contentData = { ...commonData, type: contentType, fileData, fileName: fileName!, mimeType: mimeType! };
        }
        
        if (existingContent) {
            updateSharedContent({ ...contentData, id: existingContent.id });
        } else {
            addSharedContent({ ...contentData, id: new Date().toISOString() });
        }
        
        resetForm();
        onSuccess();
    };

    return (
        <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6 sticky top-8">
            <h2 className="text-2xl font-bold mb-6">{existingContent ? 'Edit Content' : 'Share New Content'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Content Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="radio" name="contentType" value="text" checked={contentType === 'text'} onChange={() => setContentType('text')} /> Text</label>
                        <label className="flex items-center gap-2"><input type="radio" name="contentType" value="file" checked={contentType === 'file' || contentType === 'image'} onChange={() => setContentType('file')} /> File/Image</label>
                    </div>
                </div>
                {contentType === 'text' ? (
                    <div>
                        <label htmlFor="textContent" className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                        <textarea id="textContent" value={textContent} onChange={e => setTextContent(e.target.value)} required rows={4} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none"></textarea>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-300 mb-1">Upload File</label>
                        <input type="file" id="fileUpload" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-cyan file:text-white hover:file:bg-cyan-500" />
                        {fileName && <p className="text-xs text-gray-400 mt-2">Uploaded: {fileName}</p>}
                    </div>
                )}
                
                <div className="flex gap-2 pt-4">
                    {existingContent && <button type="button" onClick={() => { resetForm(); onSuccess(); }} className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700">Cancel</button>}
                    <button type="submit" className="w-full bg-brand-cyan text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-500 flex items-center justify-center gap-2">
                        <UploadIcon /> {existingContent ? 'Update' : 'Share'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const ContentList: React.FC<{
    contentItems: SharedContent[],
    onEdit: (content: SharedContent) => void,
    onDelete: (id: string) => void,
}> = ({ contentItems, onEdit, onDelete }) => (
    <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Shared Materials</h2>
        {contentItems.length === 0 ? (
            <p className="text-gray-500">No content has been shared yet.</p>
        ) : (
            <div className="space-y-4">
                {contentItems.map(item => (
                    <div key={item.id} className="bg-brand-dark p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                           <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {item.type === 'image' ? <ImageIcon/> : <FileTextIcon/>}
                                    <h3 className="text-lg font-semibold">{item.title}</h3>
                                </div>
                                <p className="text-sm text-gray-400">{item.description}</p>
                           </div>
                           <div className="flex gap-2 ml-4">
                               <button onClick={() => onEdit(item)} className="text-yellow-400 hover:text-yellow-300 p-2 rounded-full bg-brand-dark-blue"><EditIcon/></button>
                               <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full bg-brand-dark-blue"><TrashIcon/></button>
                           </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);


// AI Content Generator Page
const ContentGeneratorPage: React.FC<{
  user: User;
  addGeneratedLecture: (lecture: GeneratedLecture) => void;
  addGeneratedCaseStudy: (study: CaseStudy) => void;
}> = ({ user, addGeneratedLecture, addGeneratedCaseStudy }) => {
    const [outline, setOutline] = useState('');
    const [contentType, setContentType] = useState<'slides' | 'case-study'>('slides');
    const [generatedContent, setGeneratedContent] = useState<({ slides: LectureSlide[] } | CaseStudy) | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!outline.trim()) {
            setError('Please provide a topic outline.');
            return;
        }
        if (!user.classCode) {
            setError('Cannot generate content without a class.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setGeneratedContent(null);
        setSuccessMessage(null);
        
        try {
            if (contentType === 'slides') {
                const content = await generateLectureSlides(outline);
                setGeneratedContent(content);
                const newLecture: GeneratedLecture = {
                  id: new Date().toISOString(),
                  topic: outline.trim().split('\n')[0].replace(/^- /, ''),
                  slides: content.slides,
                  classCode: user.classCode,
                };
                addGeneratedLecture(newLecture);
                setSuccessMessage('Lecture slides generated and saved!');
            } else {
                const content = await generateCaseStudy(outline);
                const newCaseStudy: CaseStudy = {
                  ...content,
                  id: new Date().toISOString(),
                  classCode: user.classCode,
                };
                setGeneratedContent(newCaseStudy);
                addGeneratedCaseStudy(newCaseStudy);
                setSuccessMessage('Case study generated and saved!');
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Column */}
            <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Generate Course Content</h2>
                <form onSubmit={handleGenerate} className="space-y-6">
                    <div>
                        <label htmlFor="outline" className="block text-sm font-medium text-gray-300 mb-2">Topic Outline</label>
                        <textarea
                            id="outline"
                            value={outline}
                            onChange={(e) => setOutline(e.target.value)}
                            placeholder="e.g., Introduction to Photosynthesis&#10;- What is it?&#10;- The chemical equation&#10;- Light-dependent reactions&#10;- Calvin cycle"
                            rows={8}
                            className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none resize-y"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
                        <div className="flex bg-brand-dark rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setContentType('slides')}
                                className={`w-1/2 py-2 rounded-md transition-colors ${contentType === 'slides' ? 'bg-brand-cyan text-white' : 'text-gray-400 hover:bg-brand-border'}`}
                            >
                                Lecture Slides
                            </button>
                            <button
                                type="button"
                                onClick={() => setContentType('case-study')}
                                className={`w-1/2 py-2 rounded-md transition-colors ${contentType === 'case-study' ? 'bg-brand-cyan text-white' : 'text-gray-400 hover:bg-brand-border'}`}
                            >
                                Case Study
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-cyan text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors duration-300 disabled:bg-cyan-800 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                            </>
                        ) : (
                            <> <SparklesIcon /> Generate Content </>
                        )}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    {successMessage && <p className="text-green-500 text-sm mt-2">{successMessage}</p>}
                </form>
            </div>
            {/* Preview Column */}
            <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Generated Content Preview</h2>
                <div className="max-h-[70vh] overflow-y-auto pr-4">
                    {!generatedContent && !isLoading && (
                        <div className="flex items-center justify-center h-full text-center text-gray-500">
                            <p>Generated content will appear here.</p>
                        </div>
                    )}
                    {isLoading && (
                        <div className="flex items-center justify-center h-full text-center text-gray-400">
                            <p>AI is thinking...</p>
                        </div>
                    )}
                    {generatedContent && 'slides' in generatedContent && (
                        <div className="space-y-6">
                            {(generatedContent as { slides: LectureSlide[] }).slides.map((slide, index) => (
                                <div key={index} className="bg-brand-dark p-4 rounded-lg border border-brand-border">
                                    <h3 className="text-xl font-bold text-brand-cyan mb-2">Slide {index + 1}: {slide.title}</h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-300 pl-2">
                                        {slide.points.map((point, pIndex) => (
                                            <li key={pIndex}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                    {generatedContent && 'introduction' in generatedContent && (
                        <div className="space-y-4 text-gray-300 prose prose-invert max-w-none">
                            <h3 className="text-2xl font-bold text-brand-cyan">{(generatedContent as CaseStudy).title}</h3>
                            <h4>Introduction</h4>
                            <p>{(generatedContent as CaseStudy).introduction}</p>
                            <h4>Problem</h4>
                            <p>{(generatedContent as CaseStudy).problem}</p>
                            <h4>Solution</h4>
                            <p>{(generatedContent as CaseStudy).solution}</p>
                            <h4>Conclusion</h4>
                            <p>{(generatedContent as CaseStudy).conclusion}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// Quiz Generation Component
const QuizGenerationPage: React.FC<Pick<TeacherPortalProps, 'user' | 'quizzes' | 'addQuiz' | 'updateQuiz' | 'deleteQuiz' | 'generatedLectures'>> = ({ user, quizzes, addQuiz, updateQuiz, deleteQuiz, generatedLectures }) => {
    const [generationMode, setGenerationMode] = useState<'topic' | 'lecture'>('topic');
    const [selectedLectureId, setSelectedLectureId] = useState<string>('');
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState('Medium');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedQuiz, setGeneratedQuiz] = useState<Omit<Quiz, 'classCode'> | null>(null);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  
    useEffect(() => {
      if (editingQuiz) {
        setTopic(editingQuiz.topic);
        setGeneratedQuiz(null); // Clear preview when editing
        setGenerationMode('topic'); // Can only edit topic
      } else {
        setTopic('');
      }
    }, [editingQuiz]);

    const handleGenerateQuiz = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (editingQuiz) { // Handle editing logic
        updateQuiz({ ...editingQuiz, topic });
        setEditingQuiz(null);
        alert('Quiz topic updated!');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setGeneratedQuiz(null);

      try {
        // FIX: The generated quiz from the service does not include a classCode.
        // The local `quiz` variable type is updated to reflect this.
        let quiz: Omit<Quiz, 'classCode'>;
        if (generationMode === 'lecture') {
            if (!selectedLectureId) throw new Error("Please select a lecture.");
            const selectedLecture = generatedLectures.find(l => l.id === selectedLectureId);
            if (!selectedLecture) throw new Error("Selected lecture not found.");

            const lectureContent = selectedLecture.slides.map(slide => 
                `Slide: ${slide.title}\n${slide.points.map(p => `- ${p}`).join('\n')}`
            ).join('\n\n');

            quiz = await generateQuizFromContent(lectureContent, numQuestions, difficulty);
            quiz.topic = `Quiz on: ${selectedLecture.topic}`;
        } else {
            if (!topic.trim()) throw new Error("Please enter a topic.");
            quiz = await generateQuiz(topic, numQuestions, difficulty);
        }
        setGeneratedQuiz(quiz);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }, [topic, numQuestions, difficulty, editingQuiz, updateQuiz, generationMode, selectedLectureId, generatedLectures]);
  
    const handleSaveQuiz = () => {
      if (generatedQuiz && user.classCode) {
        addQuiz({...generatedQuiz, classCode: user.classCode});
        setGeneratedQuiz(null);
        setTopic('');
        setSelectedLectureId('');
        alert('Quiz saved and is now available for students!');
      }
    };
    
    const handleCancelEdit = () => {
        setEditingQuiz(null);
        setError(null);
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">{editingQuiz ? `Editing Quiz: ${editingQuiz.topic}` : 'Create a New Quiz'}</h2>
          <form onSubmit={handleGenerateQuiz} className="space-y-4">
            {!editingQuiz && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Generation Mode</label>
                    <div className="flex bg-brand-dark rounded-lg p-1">
                        <button type="button" onClick={() => setGenerationMode('topic')} className={`w-1/2 py-2 rounded-md transition-colors ${generationMode === 'topic' ? 'bg-brand-cyan text-white' : 'text-gray-400 hover:bg-brand-border'}`}>From Topic</button>
                        <button type="button" onClick={() => setGenerationMode('lecture')} className={`w-1/2 py-2 rounded-md transition-colors ${generationMode === 'lecture' ? 'bg-brand-cyan text-white' : 'text-gray-400 hover:bg-brand-border'}`}>From Lecture</button>
                    </div>
                </div>
            )}
            
            {generationMode === 'topic' ? (
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">Quiz Topic</label>
                  <input
                    type="text"
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., 'React Hooks'"
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                  />
                </div>
            ) : (
                <div>
                    <label htmlFor="lecture" className="block text-sm font-medium text-gray-300 mb-2">Select Lecture</label>
                    <select
                        id="lecture"
                        value={selectedLectureId}
                        onChange={(e) => setSelectedLectureId(e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                        disabled={generatedLectures.length === 0}
                    >
                        <option value="">{generatedLectures.length === 0 ? 'No lectures generated yet' : 'Select a lecture...'}</option>
                        {generatedLectures.map(lecture => (
                            <option key={lecture.id} value={lecture.id}>{lecture.topic}</option>
                        ))}
                    </select>
                </div>
            )}

            {!editingQuiz && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-300 mb-2">Questions</label>
                  <input
                    type="number"
                    id="numQuestions"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    min="1"
                    max="10"
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-4 pt-2">
                {editingQuiz ? (
                    <>
                        <button type="button" onClick={handleCancelEdit} className="w-full bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors duration-300">Cancel</button>
                        <button type="submit" className="w-full bg-brand-light-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-300">Update Topic</button>
                    </>
                ) : (
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-cyan text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors duration-300 disabled:bg-cyan-800 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                        {isLoading ? (
                            <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                            </>
                        ) : (
                            <> <SparklesIcon /> Generate with AI </>
                        )}
                    </button>
                )}
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>

        <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Quiz Preview</h2>
            {generatedQuiz ? (
                 <div className="h-full flex flex-col">
                    <h3 className="text-xl font-bold mb-4">{generatedQuiz.topic}</h3>
                    <div className="space-y-4 mb-6 flex-grow overflow-y-auto pr-2 max-h-80">
                        {generatedQuiz.questions.map((q, i) => (
                        <div key={i} className="bg-brand-dark p-3 rounded-md">
                            <p className="font-semibold">{i + 1}. {q.questionText}</p>
                            <ul className="list-disc list-inside ml-4 mt-1 text-sm text-gray-400">
                            {q.options.map((opt, j) => (
                                <li key={j} className={j === q.correctAnswerIndex ? 'text-green-400 font-medium' : ''}>{opt}</li>
                            ))}
                            </ul>
                        </div>
                        ))}
                    </div>
                    <button onClick={handleSaveQuiz} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center justify-center gap-2">
                        <BookOpenIcon /> Save and Publish Quiz
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-500">
                    <p>Generated quiz will be displayed here for review before saving.</p>
                </div>
            )}
        </div>
      </div>
      <div className="mt-8 bg-brand-dark-blue border border-brand-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">My Quizzes</h2>
          {quizzes.length > 0 ? (
            <div className="space-y-4">
                {quizzes.map(quiz => (
                    <div key={quiz.id} className="bg-brand-dark p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold">{quiz.topic}</h3>
                            <p className="text-sm text-gray-400">{quiz.questions.length} questions</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setEditingQuiz(quiz)} className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300"><EditIcon/> Edit</button>
                            <button onClick={() => deleteQuiz(quiz.id)} className="flex items-center gap-2 text-red-500 hover:text-red-400"><TrashIcon/> Delete</button>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">You haven't created any quizzes yet.</p>
          )}
      </div>
    </>
    );
};

// Visualization Page Component
const VisualizationPage: React.FC<{quizzes: Quiz[], submissions: Submission[]}> = ({ quizzes, submissions }) => {
    if (quizzes.length === 0) {
        return (
            <div className="bg-brand-dark-blue border border-brand-border rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">No Quizzes Found</h2>
                <p className="text-gray-400">Create a quiz in the "Quiz Generation" tab to see student analytics here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {quizzes.map(quiz => {
                const quizSubmissions = submissions.filter(s => s.quizId === quiz.id);
                const averageScore = quizSubmissions.length > 0
                    ? (quizSubmissions.reduce((acc, s) => acc + s.score, 0) / quizSubmissions.length).toFixed(1)
                    : 0;
                
                return (
                    <div key={quiz.id} className="bg-brand-dark-blue border border-brand-border rounded-lg p-8">
                        <h3 className="text-2xl font-bold mb-4">{quiz.topic}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
                            <div className="bg-brand-dark p-4 rounded-lg">
                                <p className="text-sm text-gray-400">Attempts</p>
                                <p className="text-3xl font-bold">{quizSubmissions.length}</p>
                            </div>
                            <div className="bg-brand-dark p-4 rounded-lg">
                                <p className="text-sm text-gray-400">Average Score</p>
                                <p className="text-3xl font-bold">{averageScore} / {quiz.questions.length}</p>
                            </div>
                        </div>

                        <h4 className="text-xl font-semibold mb-4">Student Results</h4>
                        {quizSubmissions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-brand-dark">
                                        <tr>
                                            <th className="p-3">Student</th>
                                            <th className="p-3">Score</th>
                                            <th className="p-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quizSubmissions.map((sub, index) => (
                                            <tr key={index} className="border-b border-brand-border">
                                                <td className="p-3">{sub.studentName}</td>
                                                <td className="p-3">{sub.score} / {sub.totalQuestions}</td>
                                                <td className="p-3 text-sm text-gray-400">{new Date(sub.submittedAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No students have taken this quiz yet.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};


export default TeacherPortal;
