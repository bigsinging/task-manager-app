import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// --- การตั้งค่า ---
// URL สำหรับเชื่อมต่อกับ Google Sheets ผ่านบริการอย่าง SheetDB.io หรือ Sheets.best
// **สำคัญ:** คุณต้องสร้าง URL นี้ด้วยตนเอง และเพิ่มคอลัมน์ 'branch' ใน Google Sheet
const SHEET_API_URL = 'https://sheetdb.io/api/v1/wasx842tflkef'; 

const USER_PIN = '112233';
const ADMIN_PIN = '110020';

const BRANCH_OPTIONS = {
    BCT: "5076 สาขาบิ๊กซีติวานนท์",
    MPW: "5082 สาขามาร์เก็ตเพลส วงศ์สว่าง"
};

// --- คอมโพเนนต์ช่วยเหลือและไอคอน ---
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LockClosedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
    </div>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const BackspaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
    </svg>
);


// --- คอมโพเนนต์หน้าต่างๆ ---

// 1. หน้าสำหรับกรอก PIN (ดีไซน์ใหม่)
const PinLogin = ({ onPinSubmit, error, setAuthError }) => {
    const [pin, setPin] = useState('');
    const onPinSubmitRef = useRef(onPinSubmit);
    onPinSubmitRef.current = onPinSubmit;

    useEffect(() => {
        if (pin.length === 6) {
            onPinSubmitRef.current(pin);
            setPin(''); // เคลียร์ PIN หลังจากส่งข้อมูล
        }
    }, [pin]);

    const handleNumberClick = useCallback((num) => {
        if (error) {
            setAuthError(''); // เคลียร์ error เมื่อเริ่มพิมพ์ใหม่
        }
        setPin(currentPin => {
            if (currentPin.length < 6) {
                return currentPin + num;
            }
            return currentPin;
        });
    }, [error, setAuthError]);

    const handleBackspace = useCallback(() => {
        if (error) {
            setAuthError(''); // เคลียร์ error
        }
        setPin(currentPin => currentPin.slice(0, -1));
    }, [error, setAuthError]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key >= '0' && event.key <= '9') {
                handleNumberClick(event.key);
            } else if (event.key === 'Backspace') {
                handleBackspace();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleNumberClick, handleBackspace]);


    const PinDisplay = () => (
        <div className="flex justify-center items-center space-x-4 h-10 mb-6">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-colors duration-200 ${
                        index < pin.length ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                />
            ))}
        </div>
    );

    const KeypadButton = ({ children, onClick, className = '' }) => (
        <button
            onClick={onClick}
            type="button"
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-light
                        bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200
                        hover:bg-gray-200 dark:hover:bg-gray-600
                        active:bg-gray-300 dark:active:bg-gray-500
                        transition-all duration-200 transform active:scale-95
                        ${className}`}
        >
            {children}
        </button>
    );

    return (
        <div className="w-full text-center">
            <img
                src="https://img5.pic.in.th/file/secure-sv1/Logo-Examfe-Task-Manager.png"
                alt="โลโก้ Task Manager"
                className="w-48 mx-auto mb-4"
            />
            <LockClosedIcon />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">กรุณาใส่รหัส PIN</h2>
            <PinDisplay />
            <div className="h-5 mb-4">
                {error && <p className="text-sm text-red-500 animate-pulse">{error}</p>}
            </div>

            <div className="grid grid-cols-3 gap-5 justify-items-center max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <KeypadButton key={num} onClick={() => handleNumberClick(num.toString())}>
                        {num}
                    </KeypadButton>
                ))}
                <div className="w-20 h-20" /> {/* Placeholder for alignment */}
                <KeypadButton onClick={() => handleNumberClick('0')}>0</KeypadButton>
                <KeypadButton onClick={handleBackspace} className="text-orange-500">
                    <BackspaceIcon />
                </KeypadButton>
            </div>
        </div>
    );
};

// 2. ฟอร์มสำหรับบันทึกงาน (สำหรับ User)
const TaskForm = ({ onLogout, onSubmit, task, setTask, employeeName, setEmployeeName, branch, setBranch, error, isLoading }) => {
    const taskOptions = ["ทำความสะอาดพื้นที่ทำงาน", "จัดเรียงสต็อกสินค้า", "ตอบกลับอีเมลลูกค้า", "เตรียมเอกสารการประชุม", "ตรวจสอบบัญชีรายวัน", "อัปเดตข้อมูลในระบบ"];

    return (
        <div>
            <div className="flex justify-between items-center mb-6 pr-12">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">บันทึกการทำงาน</h2>
                 <button onClick={onLogout} className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500">ออกจากระบบ</button>
            </div>
            <form onSubmit={onSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สาขา</label>
                    <select id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-xl shadow-sm focus:ring-orange-500 focus:border-orange-500">
                        <option value="" disabled>-- กรุณาเลือกสาขา --</option>
                        {Object.values(BRANCH_OPTIONS).map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="task" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่องานที่ทำเสร็จสิ้น</label>
                    <select id="task" value={task} onChange={(e) => setTask(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-xl shadow-sm focus:ring-orange-500 focus:border-orange-500">
                        <option value="" disabled>-- กรุณาเลือกงาน --</option>
                        {taskOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อผู้ดำเนินการ</label>
                    <input type="text" id="employeeName" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="เช่น สมชาย ใจดี" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-xl shadow-sm focus:ring-orange-500 focus:border-orange-500" />
                </div>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300 dark:disabled:bg-orange-800 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200">
                        {isLoading ? 'กำลังบันทึก...' : 'ยืนยันการทำงาน'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// 3. หน้าแสดงผลการยืนยัน
const ConfirmationPage = ({ task, employeeName, branch, onReset }) => (
    <div className="text-center p-4">
        <CheckCircleIcon />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-4 mb-2">ดำเนินการเรียบร้อยแล้ว!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">ระบบได้บันทึกข้อมูลการทำงานของคุณแล้ว</p>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-left space-y-3 border border-gray-200 dark:border-gray-600">
             <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">สาขา:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{branch}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ชื่องาน:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{task}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ผู้ดำเนินการ:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{employeeName}</p>
            </div>
        </div>
        <button onClick={onReset} className="mt-8 w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transform hover:-translate-y-0.5 transition-all duration-200">
            กลับไปหน้าแรก
        </button>
    </div>
);

// 4. แดชบอร์ดสำหรับ Admin
const AnimatedTabs = ({ tabs, activeTab, setActiveTab }) => {
    const [gliderStyle, setGliderStyle] = useState({});
    const tabsRef = useRef([]);

    useEffect(() => {
        const activeTabIndex = tabs.findIndex(t => t.id === activeTab);
        const activeTabEl = tabsRef.current[activeTabIndex];
        
        if (activeTabEl) {
            setGliderStyle({
                left: activeTabEl.offsetLeft,
                width: activeTabEl.offsetWidth,
            });
        }
    }, [activeTab, tabs]);

    return (
        <div className="relative flex justify-center bg-gray-100 dark:bg-gray-900 p-1 rounded-full mb-6">
            <div 
                className="absolute top-1 left-0 h-[calc(100%-0.5rem)] bg-orange-500 rounded-full shadow-md transition-all duration-300 ease-in-out"
                style={gliderStyle}
            />
            {tabs.map((tab, index) => (
                <button
                    key={tab.id}
                    ref={el => tabsRef.current[index] = el}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 w-1/3 ${activeTab === tab.id ? 'text-white' : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

const AdminDashboard = ({ onLogout }) => {
    const [allTasks, setAllTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('all');

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        if (SHEET_API_URL === 'YOUR_GOOGLE_SHEET_API_URL_HERE') {
            setError('กรุณาตั้งค่า SHEET_API_URL ในโค้ดก่อน');
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(SHEET_API_URL);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
            const data = await response.json();
            setAllTasks(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            setTimeout(() => setIsLoaded(true), 100);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const availableMonths = useMemo(() => {
        const months = new Set(allTasks.map(t => t.timestamp ? t.timestamp.substring(0, 7) : '')); // YYYY-MM
        return Array.from(months).filter(Boolean);
    }, [allTasks]);

    const filteredTasks = useMemo(() => {
        return allTasks.filter(t => {
            const isMonthMatch = selectedMonth === 'all' || (t.timestamp && t.timestamp.startsWith(selectedMonth));
            const isBranchMatch = activeTab === 'all' || t.branch === (activeTab === 'BCT' ? BRANCH_OPTIONS.BCT : BRANCH_OPTIONS.MPW);
            return isMonthMatch && isBranchMatch;
        });
    }, [allTasks, selectedMonth, activeTab]);

    const totalTasks = filteredTasks.length;
    const uniqueEmployees = [...new Set(filteredTasks.map(t => t.employeeName))].length;
    
    const TABS = [
        { id: 'all', label: 'ทั้งหมด' },
        { id: 'BCT', label: 'บิ๊กซีติวานนท์' },
        { id: 'MPW', label: 'มาร์เก็ตเพลสวงศ์สว่าง' },
    ];

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6 pr-12">
                <div className="flex items-center gap-3">
                     <img
                        src="https://img5.pic.in.th/file/secure-sv1/Logo-Examfe-Task-Manager.png"
                        alt="โลโก้ Task Manager"
                        className="h-10"
                    />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">แดชบอร์ด</h2>
                </div>
                <button onClick={onLogout} className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500">ออกจากระบบ</button>
            </div>
            
            <AnimatedTabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                    <p className="text-sm text-blue-800 dark:text-blue-300">งานทั้งหมด</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">{totalTasks}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
                    <p className="text-sm text-green-800 dark:text-green-300">จำนวนพนักงาน</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-200">{uniqueEmployees}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 gap-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">ประวัติล่าสุด</h3>
                <select 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-xl shadow-sm text-sm focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="all">ทุกเดือน</option>
                    {availableMonths.map(month => (
                        <option key={month} value={month}>
                            {new Date(month + '-01').toLocaleString('th-TH', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                        </option>
                    ))}
                </select>
                <button onClick={fetchData} disabled={isLoading} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:text-gray-300 dark:disabled:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5" /></svg>
                </button>
            </div>

            {isLoading ? <LoadingSpinner /> :
             error ? <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-xl">{error}</p> :
             <div className="space-y-3 h-72 overflow-y-auto pr-2">
                {filteredTasks.map((t, index) => (
                    <div 
                        key={`${t.timestamp}-${index}`} 
                        className={`bg-white dark:bg-gray-800/70 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-500 ease-out transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ transitionDelay: `${index * 50}ms` }}
                    >
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{t.task}</p>
                        <div className="flex justify-between items-baseline text-sm mt-1">
                            <p className="text-orange-600 dark:text-orange-400 font-medium">{t.employeeName}</p>
                            <p className="text-gray-500 dark:text-gray-400">{t.timestamp ? new Date(t.timestamp).toLocaleString('th-TH') : 'N/A'}</p>
                        </div>
                    </div>
                ))}
                {filteredTasks.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 pt-8">ไม่พบข้อมูล</p>}
             </div>
            }
        </div>
    );
};


// --- คอมโพเนนต์หลักของแอป ---
export default function App() {
    const [theme, setTheme] = useState('light');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [authError, setAuthError] = useState('');
    const [task, setTask] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [branch, setBranch] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formError, setFormError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const handlePinSubmit = (submittedPin) => {
        if (submittedPin === USER_PIN) {
            setIsAuthenticated(true);
            setUserRole('user');
            setAuthError('');
        } else if (submittedPin === ADMIN_PIN) {
            setIsAuthenticated(true);
            setUserRole('admin');
            setAuthError('');
        } else {
            setAuthError('รหัส PIN ไม่ถูกต้อง');
        }
    };
    
    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserRole(null);
        setAuthError('');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!branch || !task || !employeeName.trim()) {
            setFormError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
            return;
        }
        
        if (SHEET_API_URL === 'YOUR_GOOGLE_SHEET_API_URL_HERE') {
            setFormError('ผู้ดูแลระบบยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล (Google Sheet)');
            return;
        }

        setIsLoading(true);
        setFormError('');

        const data = {
            timestamp: new Date().toISOString(),
            branch: branch,
            task: task,
            employeeName: employeeName.trim(),
        };

        try {
            const response = await fetch(SHEET_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('ไม่สามารถบันทึกข้อมูลได้');
            setIsSubmitted(true);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetForm = () => {
        setTask('');
        setEmployeeName('');
        setBranch('');
        setIsSubmitted(false);
        setFormError('');
    };

    const renderContent = () => {
        if (!isAuthenticated) {
            return <PinLogin onPinSubmit={handlePinSubmit} error={authError} setAuthError={setAuthError} />;
        }

        if (userRole === 'admin') {
            return <AdminDashboard onLogout={handleLogout} />;
        }

        if (userRole === 'user') {
            if (isSubmitted) {
                return <ConfirmationPage task={task} employeeName={employeeName} branch={branch} onReset={handleResetForm} />;
            }
            return <TaskForm 
                onLogout={handleLogout}
                onSubmit={handleFormSubmit} 
                task={task} setTask={setTask} 
                employeeName={employeeName} setEmployeeName={setEmployeeName} 
                branch={branch} setBranch={setBranch}
                error={formError} 
                isLoading={isLoading} 
            />;
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;700&display=swap');
                body { font-family: 'Noto Sans Thai', sans-serif; }
            `}</style>
            <div 
                className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center transition-colors duration-300" 
                style={{ backgroundImage: "url('https://img5.pic.in.th/file/secure-sv1/2025-ExamFE-Background.png')" }}
            >
                <div className="w-full max-w-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 transition-all duration-300 relative">
                    <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    </button>
                    {renderContent()}
                </div>
            </div>
        </>
    );
}
