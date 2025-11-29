// Teacher Dashboard JavaScript

let currentUser = null;
let currentProfile = null;

// Initialize teacher dashboard
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Teacher dashboard initializing...');
    
    try {
        // Check authentication
        console.log('Checking authentication...');
        currentUser = await checkAuth();
        console.log('Current user:', currentUser);
        
        if (!currentUser) {
            console.log('No user found, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        // Get user profile
        console.log('Getting user profile...');
        currentProfile = await getUserProfile(currentUser.id);
        console.log('Current profile:', currentProfile);
        
        if (!currentProfile || currentProfile.role !== 'teacher') {
            console.log('User is not a teacher, redirecting');
            window.location.href = 'index.html';
            return;
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        // Continue with setup even if auth fails for debugging
    }
    
    // Update UI with user info
    try {
        const userNameEl = document.getElementById('userName');
        if (userNameEl && currentProfile) {
            userNameEl.textContent = `Welcome, ${currentProfile.full_name}`;
        }
    } catch (error) {
        console.error('Error updating user info:', error);
    }
    
    // Setup navigation
    console.log('Setting up navigation...');
    setupNavigation();
    
    // Setup logout
    console.log('Setting up logout...');
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Setup modals and forms
    console.log('Setting up modals...');
    setupModals();
    console.log('Setting up form handlers...');
    setupFormHandlers();
    
    // Set default attendance date to today
    document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
    
    // Load initial data
    console.log('Loading initial data...');
    try {
        loadStudyMaterials();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
    
    console.log('Teacher dashboard initialization complete');
    
    // Test database connection
    testDatabaseConnection();
    
    // Debug user status
    debugUserStatus();
});

// Debug user and profile status
async function debugUserStatus() {
    console.log('=== USER DEBUG INFO ===');
    
    try {
        // Check current auth user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('Auth user:', user);
        console.log('Auth error:', userError);
        
        if (user) {
            // Check if profile exists
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
                
            console.log('User profile:', profile);
            console.log('Profile error:', profileError);
            
            // Check materials count
            const { data: materialsCount, error: countError } = await supabase
                .from('materials')
                .select('id')
                .eq('uploaded_by', user.id);
                
            console.log('User materials count:', materialsCount?.length || 0);
            console.log('Materials count error:', countError);
        }
    } catch (error) {
        console.error('Debug error:', error);
    }
    
    console.log('=== END DEBUG INFO ===');
}

// Test database connection
async function testDatabaseConnection() {
    console.log('Testing database connection...');
    
    try {
        // Test simple query
        const { data, error } = await supabase
            .from('materials')
            .select('id')
            .limit(1);
            
        console.log('Database test result:', { data, error });
        
        if (error) {
            console.error('Database connection failed:', error);
        } else {
            console.log('Database connection successful');
        }
    } catch (error) {
        console.error('Database test error:', error);
    }
}

// Logout function
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if logout fails
        window.location.href = 'index.html';
    }
}

// Fallback setup for debugging - runs regardless of auth
window.addEventListener('load', () => {
    console.log('Window loaded - setting up fallback handlers');
    
    // Ensure modal handlers work even if main init fails
    const addMaterialBtn = document.getElementById('addMaterialBtn');
    const materialModal = document.getElementById('materialModal');
    
    if (addMaterialBtn && materialModal) {
        // Remove any existing listeners and add new one
        addMaterialBtn.onclick = () => {
            console.log('Fallback: Add material button clicked!');
            materialModal.style.display = 'block';
        };
        console.log('Fallback handler attached');
    }
    
    // Setup close handlers
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = (e) => {
            console.log('Fallback: Close button clicked');
            e.target.closest('.modal').style.display = 'none';
        };
    });
});

// Setup navigation between sections
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            
            // Update active nav button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active section
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');
            
            // Load section data
            loadSectionData(targetSection);
        });
    });
}

// Load data based on active section
function loadSectionData(section) {
    switch(section) {
        case 'materials':
            loadStudyMaterials();
            break;
        case 'assignments':
            loadAssignments();
            break;
        case 'attendance':
            loadStudentsForAttendance();
            break;
        case 'quizzes':
            loadQuizzes();
            break;
        case 'notifications':
            loadNotifications();
            break;
    }
}

// Setup form handlers
function setupFormHandlers() {
    console.log('Setting up form handlers...');
    
    // Add material button
    const addMaterialBtn = document.getElementById('addMaterialBtn');
    const materialModal = document.getElementById('materialModal');
    
    console.log('Add material button:', addMaterialBtn);
    console.log('Material modal:', materialModal);
    
    if (addMaterialBtn && materialModal) {
        addMaterialBtn.addEventListener('click', () => {
            console.log('Add material button clicked!');
            materialModal.style.display = 'block';
            console.log('Modal display set to block');
        });
        console.log('Add material event listener attached');
    } else {
        console.error('Add material button or modal not found!');
    }
    
    // Add assignment button
    document.getElementById('addAssignmentBtn').addEventListener('click', () => {
        document.getElementById('assignmentModal').style.display = 'block';
    });
    
    // Add quiz button
    document.getElementById('addQuizBtn').addEventListener('click', () => {
        document.getElementById('quizModal').style.display = 'block';
    });
    
    // Add notification button
    document.getElementById('addNotificationBtn').addEventListener('click', () => {
        document.getElementById('notificationModal').style.display = 'block';
    });
    
    // Attendance date change
    document.getElementById('attendanceDate').addEventListener('change', loadStudentsForAttendance);
}

// Load study materials
async function loadStudyMaterials() {
    const container = document.getElementById('materialsList');
    container.innerHTML = '<div class="loading">Loading materials...</div>';
    
    try {
        // Check if user is available
        if (!currentUser) {
            console.log('No current user, trying to get user...');
            currentUser = await checkAuth();
        }
        
        if (!currentUser) {
            console.log('Still no user, loading all materials instead');
            // Load all materials if no user (for debugging)
            const { data: materials, error } = await supabase
                .from('materials')
                .select(`
                    *,
                    profiles:uploaded_by (full_name)
                `)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error loading all materials:', error);
                container.innerHTML = '<div class="empty-state"><h3>Error loading materials</h3><p>Please try refreshing the page.</p></div>';
                return;
            }
            
            if (materials.length === 0) {
                container.innerHTML = '<div class="empty-state"><h3>No materials found</h3><p>No materials have been uploaded yet.</p></div>';
                return;
            }
            
            container.innerHTML = materials.map(material => `
                <div class="card">
                    <h3>${material.title}</h3>
                    <p>${material.description || 'No description available'}</p>
                    <p><small>Uploaded by: ${material.profiles?.full_name || 'Unknown'}</small></p>
                    <p><small>Uploaded: ${formatDate(material.created_at)}</small></p>
                    <div class="card-actions">
                        ${material.file_path ? `
                            <button class="btn btn-secondary" onclick="downloadMaterial('${material.file_path}', '${material.title}')">
                                Download
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
            return;
        }
        
        console.log('Loading materials for user:', currentUser.id);
        
        // Load all materials (teachers can see all materials)
        const { data: materials, error } = await supabase
            .from('materials')
            .select('*')
            .order('created_at', { ascending: false });
            
        console.log('Materials query result:', { materials, error });
        
        if (error) {
            console.error('Error loading materials:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading materials</h3></div>';
            return;
        }
        
        if (materials.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No materials uploaded</h3><p>Click "Add Material" to upload your first study material.</p></div>';
            return;
        }
        
        container.innerHTML = materials.map(material => {
            const isOwnMaterial = currentUser && material.uploaded_by === currentUser.id;
            
            return `
                <div class="card">
                    <h3>${material.title}</h3>
                    <p>${material.description || 'No description available'}</p>
                    <p><small>Uploaded: ${formatDate(material.created_at)}</small></p>
                    ${isOwnMaterial ? '<p><small><strong>Uploaded by you</strong></small></p>' : ''}
                    <div class="card-actions">
                        ${material.file_path ? `
                            <button class="btn btn-secondary" onclick="downloadMaterial('${material.file_path}', '${material.title}')">
                                Download
                            </button>
                        ` : ''}
                        ${isOwnMaterial ? `
                            <button class="btn btn-danger" onclick="deleteMaterial('${material.id}')">
                                Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading materials:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading materials</h3></div>';
    }
}

// Download material file
async function downloadMaterial(filePath, title) {
    try {
        await downloadFile(STORAGE_BUCKETS.MATERIALS, filePath, title);
    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading file. Please try again.');
    }
}

// Delete material
async function deleteMaterial(materialId) {
    if (!confirm('Are you sure you want to delete this material?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('materials')
            .delete()
            .eq('id', materialId);
        
        if (error) {
            console.error('Error deleting material:', error);
            alert('Error deleting material. Please try again.');
            return;
        }
        
        alert('Material deleted successfully!');
        loadStudyMaterials(); // Reload materials
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting material. Please try again.');
    }
}

// Load assignments
async function loadAssignments() {
    const container = document.getElementById('assignmentsList');
    container.innerHTML = '<div class="loading">Loading assignments...</div>';
    
    try {
        // Load assignments with simple query first
        const { data: assignments, error } = await supabase
            .from('assignments')
            .select('*')
            .eq('teacher_id', currentUser.id)
            .order('created_at', { ascending: false });
            
        console.log('Teacher assignments query result:', { assignments, error });
        
        if (error) {
            console.error('Error loading assignments:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading assignments</h3></div>';
            return;
        }
        
        if (assignments.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No assignments created</h3><p>Click "Create Assignment" to create your first assignment.</p></div>';
            return;
        }
        
        // Get submission counts separately
        const assignmentIds = assignments.map(a => a.id);
        let submissionCounts = {};
        
        if (assignmentIds.length > 0) {
            const { data: submissions } = await supabase
                .from('submissions')
                .select('assignment_id')
                .in('assignment_id', assignmentIds);
                
            submissions?.forEach(sub => {
                submissionCounts[sub.assignment_id] = (submissionCounts[sub.assignment_id] || 0) + 1;
            });
        }
        
        container.innerHTML = assignments.map(assignment => {
            const submissionCount = submissionCounts[assignment.id] || 0;
            
            return `
                <div class="card">
                    <h3>${assignment.title}</h3>
                    <p>${assignment.description || 'No description available'}</p>
                    <p><strong>Deadline:</strong> ${formatDate(assignment.deadline)}</p>
                    <p><strong>Submissions:</strong> ${submissionCount}</p>
                    <p><small>Created: ${formatDate(assignment.created_at)}</small></p>
                    <div class="card-actions">
                        ${assignment.file_path ? `
                            <button class="btn btn-secondary" onclick="downloadAssignment('${assignment.file_path}', '${assignment.title}')">
                                Download
                            </button>
                        ` : ''}
                        <button class="btn btn-primary" onclick="viewSubmissions('${assignment.id}', '${assignment.title}')">
                            View Submissions (${submissionCount})
                        </button>
                        <button class="btn btn-danger" onclick="deleteAssignment('${assignment.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading assignments:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading assignments</h3></div>';
    }
}

// Download assignment file
async function downloadAssignment(filePath, title) {
    try {
        await downloadFile(STORAGE_BUCKETS.ASSIGNMENTS, filePath, title);
    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading file. Please try again.');
    }
}

// View assignment submissions
async function viewSubmissions(assignmentId, assignmentTitle) {
    try {
        const { data: submissions, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('assignment_id', assignmentId)
            .order('submitted_at', { ascending: false });
        
        if (error) {
            console.error('Error loading submissions:', error);
            alert('Error loading submissions. Please try again.');
            return;
        }
        
        const submissionsContainer = document.getElementById('submissionsList');
        
        if (submissions.length === 0) {
            submissionsContainer.innerHTML = '<div class="empty-state"><h3>No submissions yet</h3><p>Students haven\'t submitted their assignments yet.</p></div>';
        } else {
            submissionsContainer.innerHTML = `
                <h4>Submissions for: ${assignmentTitle}</h4>
                <div class="submissions-grid">
                    ${submissions.map(submission => `
                        <div class="card">
                            <h4>Student Submission</h4>
                            <p><strong>Submitted:</strong> ${formatDate(submission.submitted_at)}</p>
                            <div class="card-actions">
                                <button class="btn btn-primary" onclick="downloadSubmission('${submission.file_path}', 'submission')">
                                    Download Submission
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        document.getElementById('submissionsModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error viewing submissions:', error);
        alert('Error viewing submissions. Please try again.');
    }
}

// Download submission file
async function downloadSubmission(filePath, studentName) {
    try {
        await downloadFile(STORAGE_BUCKETS.SUBMISSIONS, filePath, `${studentName}_submission`);
    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading submission. Please try again.');
    }
}

// Delete assignment
async function deleteAssignment(assignmentId) {
    if (!confirm('Are you sure you want to delete this assignment? This will also delete all submissions.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', assignmentId);
        
        if (error) {
            console.error('Error deleting assignment:', error);
            alert('Error deleting assignment. Please try again.');
            return;
        }
        
        alert('Assignment deleted successfully!');
        loadAssignments(); // Reload assignments
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting assignment. Please try again.');
    }
}

// Load students for attendance
async function loadStudentsForAttendance() {
    const container = document.getElementById('studentsList');
    const selectedDate = document.getElementById('attendanceDate').value;
    
    if (!selectedDate) {
        container.innerHTML = '<div class="empty-state"><h3>Please select a date</h3></div>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Loading students...</div>';
    
    try {
        // Get all students
        const { data: students, error: studentsError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'student')
            .order('full_name');
        
        if (studentsError) {
            console.error('Error loading students:', studentsError);
            container.innerHTML = '<div class="empty-state"><h3>Error loading students</h3></div>';
            return;
        }
        
        // Get existing attendance for selected date
        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('student_id, status')
            .eq('date', selectedDate)
            .eq('teacher_id', currentUser.id);
        
        if (attendanceError) {
            console.error('Error loading attendance:', attendanceError);
        }
        
        const attendanceMap = {};
        attendance?.forEach(record => {
            attendanceMap[record.student_id] = record.status;
        });
        
        if (students.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No students found</h3><p>No students are registered in the system.</p></div>';
            return;
        }
        
        container.innerHTML = students.map(student => {
            const currentStatus = attendanceMap[student.id] || '';
            
            return `
                <div class="card student-card">
                    <div class="student-info">
                        <h4>${student.full_name}</h4>
                        ${currentStatus ? `<div class="attendance-status ${currentStatus}">${currentStatus.toUpperCase()}</div>` : ''}
                    </div>
                    <div class="attendance-controls">
                        <button class="btn btn-success ${currentStatus === 'present' ? 'active' : ''}" 
                                onclick="markAttendance('${student.id}', 'present', '${selectedDate}')">
                            Present
                        </button>
                        <button class="btn btn-danger ${currentStatus === 'absent' ? 'active' : ''}" 
                                onclick="markAttendance('${student.id}', 'absent', '${selectedDate}')">
                            Absent
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading students:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading students</h3></div>';
    }
}

// Mark attendance
async function markAttendance(studentId, status, date) {
    try {
        const { error } = await supabase
            .from('attendance')
            .upsert([
                {
                    student_id: studentId,
                    date: date,
                    status: status,
                    teacher_id: currentUser.id
                }
            ], {
                onConflict: 'student_id,date'
            });
        
        if (error) {
            console.error('Error marking attendance:', error);
            alert('Error marking attendance. Please try again.');
            return;
        }
        
        // Reload students to update UI
        loadStudentsForAttendance();
        
    } catch (error) {
        console.error('Attendance error:', error);
        alert('Error marking attendance. Please try again.');
    }
}

// Load quizzes
async function loadQuizzes() {
    const container = document.getElementById('quizzesList');
    container.innerHTML = '<div class="loading">Loading quizzes...</div>';
    
    try {
        const { data: quizzes, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('teacher_id', currentUser.id)
            .order('created_at', { ascending: false });
            
        console.log('Teacher quizzes query result:', { quizzes, error });
        
        if (error) {
            console.error('Error loading quizzes:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading quizzes</h3></div>';
            return;
        }
        
        if (quizzes.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No quizzes created</h3><p>Click "Create Quiz" to create your first quiz.</p></div>';
            return;
        }
        
        // Get quiz results separately
        const quizIds = quizzes.map(q => q.id);
        let quizStats = {};
        
        if (quizIds.length > 0) {
            const { data: results } = await supabase
                .from('quiz_results')
                .select('quiz_id, is_correct')
                .in('quiz_id', quizIds);
                
            results?.forEach(result => {
                if (!quizStats[result.quiz_id]) {
                    quizStats[result.quiz_id] = { total: 0, correct: 0 };
                }
                quizStats[result.quiz_id].total++;
                if (result.is_correct) {
                    quizStats[result.quiz_id].correct++;
                }
            });
        }
        
        container.innerHTML = quizzes.map(quiz => {
            const stats = quizStats[quiz.id] || { total: 0, correct: 0 };
            const totalAttempts = stats.total;
            const correctAttempts = stats.correct;
            
            return `
                <div class="card">
                    <h3>Quiz Question</h3>
                    <p>${quiz.question}</p>
                    <p><strong>Options:</strong></p>
                    <ul>
                        ${quiz.options.map((option, index) => `
                            <li>${option} ${index === quiz.correct_index ? '✅' : ''}</li>
                        `).join('')}
                    </ul>
                    <p><strong>Attempts:</strong> ${totalAttempts}</p>
                    <p><strong>Correct Answers:</strong> ${correctAttempts}</p>
                    <p><small>Created: ${formatDate(quiz.created_at)}</small></p>
                    <div class="card-actions">
                        <button class="btn btn-danger" onclick="deleteQuiz('${quiz.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading quizzes:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading quizzes</h3></div>';
    }
}

// Delete quiz
async function deleteQuiz(quizId) {
    if (!confirm('Are you sure you want to delete this quiz? This will also delete all results.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', quizId);
        
        if (error) {
            console.error('Error deleting quiz:', error);
            alert('Error deleting quiz. Please try again.');
            return;
        }
        
        alert('Quiz deleted successfully!');
        loadQuizzes(); // Reload quizzes
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting quiz. Please try again.');
    }
}

// Load notifications
async function loadNotifications() {
    const container = document.getElementById('notificationsList');
    container.innerHTML = '<div class="loading">Loading notifications...</div>';
    
    try {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading notifications:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading notifications</h3></div>';
            return;
        }
        
        if (notifications.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No notifications sent</h3><p>Click "Send Notification" to send your first notification.</p></div>';
            return;
        }
        
        container.innerHTML = notifications.map(notification => `
            <div class="card">
                <h3>${notification.title}</h3>
                <p>${notification.message}</p>
                <p><strong>Target:</strong> ${notification.target_role}</p>
                <p><small>Sent: ${formatDate(notification.created_at)}</small></p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading notifications</h3></div>';
    }
}

// Setup modals
function setupModals() {
    // Material form
    const materialForm = document.getElementById('materialForm');
    materialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('materialTitle').value;
        const description = document.getElementById('materialDescription').value;
        const file = document.getElementById('materialFile').files[0];
        
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }
        
        try {
            // Upload file to storage
            const fileName = `${Date.now()}_${file.name}`;
            const uploadResult = await uploadFile(STORAGE_BUCKETS.MATERIALS, file, fileName);
            
            if (!uploadResult) {
                alert('Error uploading file. Please try again.');
                return;
            }
            
            // Save material record
            const { error } = await supabase
                .from('materials')
                .insert([
                    {
                        title: title,
                        description: description,
                        file_path: fileName,
                        uploaded_by: currentUser.id
                    }
                ]);
            
            if (error) {
                console.error('Error saving material:', error);
                alert('Error saving material. Please try again.');
                return;
            }
            
            alert('Material uploaded successfully!');
            document.getElementById('materialModal').style.display = 'none';
            materialForm.reset();
            loadStudyMaterials(); // Reload materials
            
        } catch (error) {
            console.error('Material upload error:', error);
            alert('Error uploading material. Please try again.');
        }
    });
    
    // Assignment form
    const assignmentForm = document.getElementById('assignmentForm');
    assignmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('assignmentTitle').value;
        const description = document.getElementById('assignmentDescription').value;
        const deadline = document.getElementById('assignmentDeadline').value;
        const file = document.getElementById('assignmentFile').files[0];
        
        try {
            let filePath = null;
            
            if (file) {
                // Upload file to storage
                const fileName = `${Date.now()}_${file.name}`;
                const uploadResult = await uploadFile(STORAGE_BUCKETS.ASSIGNMENTS, file, fileName);
                
                if (!uploadResult) {
                    alert('Error uploading file. Please try again.');
                    return;
                }
                
                filePath = fileName;
            }
            
            // Save assignment record
            const { error } = await supabase
                .from('assignments')
                .insert([
                    {
                        title: title,
                        description: description,
                        deadline: deadline,
                        file_path: filePath,
                        teacher_id: currentUser.id
                    }
                ]);
            
            if (error) {
                console.error('Error saving assignment:', error);
                alert('Error saving assignment. Please try again.');
                return;
            }
            
            alert('Assignment created successfully!');
            document.getElementById('assignmentModal').style.display = 'none';
            assignmentForm.reset();
            loadAssignments(); // Reload assignments
            
        } catch (error) {
            console.error('Assignment creation error:', error);
            alert('Error creating assignment. Please try again.');
        }
    });
    
    // Quiz form
    const quizForm = document.getElementById('quizForm');
    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const question = document.getElementById('quizQuestion').value;
        const option1 = document.getElementById('option1').value;
        const option2 = document.getElementById('option2').value;
        const option3 = document.getElementById('option3').value;
        const option4 = document.getElementById('option4').value;
        const correctAnswer = parseInt(document.getElementById('correctAnswer').value);
        
        const options = [option1, option2, option3, option4];
        
        try {
            // Save quiz record
            const { error } = await supabase
                .from('quizzes')
                .insert([
                    {
                        question: question,
                        options: options,
                        correct_index: correctAnswer,
                        teacher_id: currentUser.id
                    }
                ]);
            
            if (error) {
                console.error('Error saving quiz:', error);
                alert('Error saving quiz. Please try again.');
                return;
            }
            
            alert('Quiz created successfully!');
            document.getElementById('quizModal').style.display = 'none';
            quizForm.reset();
            loadQuizzes(); // Reload quizzes
            
        } catch (error) {
            console.error('Quiz creation error:', error);
            alert('Error creating quiz. Please try again.');
        }
    });
    
    // Notification form
    const notificationForm = document.getElementById('notificationForm');
    notificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('notificationTitle').value;
        const message = document.getElementById('notificationMessage').value;
        const targetRole = document.getElementById('targetRole').value;
        
        try {
            // Save notification record
            const { error } = await supabase
                .from('notifications')
                .insert([
                    {
                        title: title,
                        message: message,
                        target_role: targetRole
                    }
                ]);
            
            if (error) {
                console.error('Error saving notification:', error);
                alert('Error saving notification. Please try again.');
                return;
            }
            
            alert('Notification sent successfully!');
            document.getElementById('notificationModal').style.display = 'none';
            notificationForm.reset();
            loadNotifications(); // Reload notifications
            
        } catch (error) {
            console.error('Notification creation error:', error);
            alert('Error sending notification. Please try again.');
        }
    });
    
    // Close modal handlers
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}