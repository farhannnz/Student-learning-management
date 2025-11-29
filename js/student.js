// Student Dashboard JavaScript

let currentUser = null;
let currentProfile = null;

// Initialize student dashboard
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Student dashboard initializing...');
    
    try {
        // Check authentication
        console.log('Student: Checking authentication...');
        currentUser = await checkAuth();
        console.log('Student: Current user:', currentUser);
        
        if (!currentUser) {
            console.log('Student: No user found, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        // Get user profile
        if (currentUser) {
            console.log('Student: Getting user profile...');
            currentProfile = await getUserProfile(currentUser.id);
            console.log('Student: Current profile:', currentProfile);
            
            if (!currentProfile || currentProfile.role !== 'student') {
                console.log('Student: User is not a student, redirecting');
                window.location.href = 'index.html';
                return;
            }
        }
    } catch (error) {
        console.error('Student: Error during initialization:', error);
        // Continue with setup even if auth fails for debugging
    }
    
    // Update UI with user info
    try {
        const userNameEl = document.getElementById('userName');
        if (userNameEl && currentProfile) {
            userNameEl.textContent = `Welcome, ${currentProfile.full_name}`;
        }
    } catch (error) {
        console.error('Student: Error updating user info:', error);
    }
    
    // Setup navigation
    console.log('Student: Setting up navigation...');
    setupNavigation();
    
    // Setup logout
    console.log('Student: Setting up logout...');
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Setup modals
    console.log('Student: Setting up modals...');
    setupModals();
    
    // Setup quiz buttons
    console.log('Student: Setting up quiz buttons...');
    setupQuizButtons();
    
    // Load initial data
    console.log('Student: Loading initial data...');
    try {
        loadStudyMaterials();
    } catch (error) {
        console.error('Student: Error loading initial data:', error);
    }
    
    console.log('Student dashboard initialization complete');
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
            loadAttendance();
            break;
        case 'quizzes':
            loadQuizzes();
            break;
        case 'notifications':
            loadNotifications();
            break;
    }
}

// Load study materials
async function loadStudyMaterials() {
    const container = document.getElementById('materialsList');
    container.innerHTML = '<div class="loading">Loading materials...</div>';
    
    try {
        console.log('Student: Loading materials...');
        
        // First try simple query without join
        const { data: materials, error } = await supabase
            .from('materials')
            .select('*')
            .order('created_at', { ascending: false });
            
        console.log('Student materials query result:', { materials, error });
        
        if (error) {
            console.error('Error loading materials:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading materials</h3></div>';
            return;
        }
        
        if (materials.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No study materials available</h3><p>Check back later for new materials.</p></div>';
            return;
        }
        
        container.innerHTML = materials.map(material => `
            <div class="card">
                <h3>${material.title}</h3>
                <p>${material.description || 'No description available'}</p>
                <p><small>Date: ${formatDate(material.created_at)}</small></p>
                <div class="card-actions">
                    ${material.file_path ? `
                        <button class="btn btn-primary" onclick="downloadMaterial('${material.file_path}', '${material.title}')">
                            Download
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
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

// Load assignments
async function loadAssignments() {
    const container = document.getElementById('assignmentsList');
    container.innerHTML = '<div class="loading">Loading assignments...</div>';
    
    try {
        // Load assignments with simple query first
        const { data: assignments, error } = await supabase
            .from('assignments')
            .select('*')
            .order('deadline', { ascending: true });
        
        if (error) {
            console.error('Error loading assignments:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading assignments</h3></div>';
            return;
        }
        
        // Also get submissions for current student
        const { data: submissions } = await supabase
            .from('submissions')
            .select('assignment_id, submitted_at')
            .eq('student_id', currentUser.id);
        
        const submissionMap = {};
        submissions?.forEach(sub => {
            submissionMap[sub.assignment_id] = sub;
        });
        
        if (assignments.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No assignments available</h3><p>Check back later for new assignments.</p></div>';
            return;
        }
        
        container.innerHTML = assignments.map(assignment => {
            const submission = submissionMap[assignment.id];
            const deadline = new Date(assignment.deadline);
            const now = new Date();
            const isOverdue = deadline < now && !submission;
            
            let statusClass = 'pending';
            let statusText = 'Pending';
            
            if (submission) {
                statusClass = 'submitted';
                statusText = 'Submitted';
            } else if (isOverdue) {
                statusClass = 'overdue';
                statusText = 'Overdue';
            }
            
            return `
                <div class="card">
                    <h3>${assignment.title}</h3>
                    <p>${assignment.description || 'No description available'}</p>
                    <p><strong>Deadline:</strong> ${formatDate(assignment.deadline)}</p>
                    <div class="assignment-status ${statusClass}">${statusText}</div>
                    ${submission ? `<p><small>Submitted: ${formatDate(submission.submitted_at)}</small></p>` : ''}
                    <div class="card-actions">
                        ${assignment.file_path ? `
                            <button class="btn btn-secondary" onclick="downloadAssignment('${assignment.file_path}', '${assignment.title}')">
                                Download Instructions
                            </button>
                        ` : ''}
                        ${!submission && !isOverdue ? `
                            <button class="btn btn-primary" onclick="openSubmissionModal('${assignment.id}')">
                                Submit Assignment
                            </button>
                        ` : ''}
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

// Open submission modal
function openSubmissionModal(assignmentId) {
    document.getElementById('assignmentId').value = assignmentId;
    document.getElementById('submissionModal').style.display = 'block';
}

// Load attendance records
async function loadAttendance() {
    const container = document.getElementById('attendanceList');
    container.innerHTML = '<div class="loading">Loading attendance...</div>';
    
    try {
        const { data: attendance, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', currentUser.id)
            .order('date', { ascending: false });
        
        if (error) {
            console.error('Error loading attendance:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading attendance</h3></div>';
            return;
        }
        
        if (attendance.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No attendance records</h3><p>Your attendance will appear here once marked by teachers.</p></div>';
            return;
        }
        
        container.innerHTML = attendance.map(record => `
            <div class="card">
                <h3>Date: ${new Date(record.date).toLocaleDateString()}</h3>
                <div class="attendance-status ${record.status}">${record.status.toUpperCase()}</div>
                <p><small>Marked by teacher</small></p>
                <p><small>Recorded: ${formatDate(record.created_at)}</small></p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading attendance:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading attendance</h3></div>';
    }
}

// Load available quizzes
async function loadQuizzes() {
    const container = document.getElementById('quizzesList');
    container.innerHTML = '<div class="loading">Loading quizzes...</div>';
    
    try {
        const { data: quizzes, error } = await supabase
            .from('quizzes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading quizzes:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading quizzes</h3></div>';
            return;
        }
        
        // Get quiz results for current student
        const { data: results } = await supabase
            .from('quiz_results')
            .select('quiz_id, is_correct, created_at')
            .eq('student_id', currentUser.id);
        
        const resultMap = {};
        results?.forEach(result => {
            resultMap[result.quiz_id] = result;
        });
        
        if (quizzes.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No quizzes available</h3><p>Check back later for new quizzes.</p></div>';
            return;
        }
        
        container.innerHTML = quizzes.map(quiz => {
            const result = resultMap[quiz.id];
            
            return `
                <div class="card">
                    <h3>Quiz Question</h3>
                    <p>${quiz.question}</p>
                    <p><small>Created by teacher</small></p>
                    ${result ? `
                        <div class="quiz-result">
                            <p><strong>Status:</strong> ${result.is_correct ? '✅ Correct' : '❌ Incorrect'}</p>
                            <p><small>Attempted: ${formatDate(result.created_at)}</small></p>
                        </div>
                    ` : `
                        <div class="card-actions">
                            <button class="btn btn-primary quiz-btn" 
                                    data-quiz-id="${quiz.id}" 
                                    data-quiz-question="${quiz.question.replace(/"/g, '&quot;')}" 
                                    data-quiz-options='${JSON.stringify(quiz.options)}'>
                                Take Quiz
                            </button>
                        </div>
                    `}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading quizzes:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading quizzes</h3></div>';
    }
}

// Open quiz modal
function openQuizModal(quizId, question, optionsJson) {
    const options = JSON.parse(optionsJson);
    
    document.getElementById('quizId').value = quizId;
    document.getElementById('quizQuestion').textContent = question;
    
    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = options.map((option, index) => `
        <div class="quiz-option">
            <label>
                <input type="radio" name="quizAnswer" value="${index}">
                ${option}
            </label>
        </div>
    `).join('');
    
    document.getElementById('quizModal').style.display = 'block';
}

// Setup quiz button event listeners
function setupQuizButtons() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quiz-btn')) {
            const quizId = e.target.dataset.quizId;
            const question = e.target.dataset.quizQuestion.replace(/&quot;/g, '"');
            const optionsJson = e.target.dataset.quizOptions;
            
            openQuizModal(quizId, question, optionsJson);
        }
    });
}

// Load notifications
async function loadNotifications() {
    const container = document.getElementById('notificationsList');
    container.innerHTML = '<div class="loading">Loading notifications...</div>';
    
    try {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .in('target_role', ['student', 'all'])
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading notifications:', error);
            container.innerHTML = '<div class="empty-state"><h3>Error loading notifications</h3></div>';
            return;
        }
        
        if (notifications.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No notifications</h3><p>You\'ll see important announcements here.</p></div>';
            return;
        }
        
        container.innerHTML = notifications.map(notification => `
            <div class="card">
                <h3>${notification.title}</h3>
                <p>${notification.message}</p>
                <p><small>Posted: ${formatDate(notification.created_at)}</small></p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<div class="empty-state"><h3>Error loading notifications</h3></div>';
    }
}

// Setup modals
function setupModals() {
    // Submission modal
    const submissionModal = document.getElementById('submissionModal');
    const submissionForm = document.getElementById('submissionForm');
    
    submissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const assignmentId = document.getElementById('assignmentId').value;
        const file = document.getElementById('submissionFile').files[0];
        
        if (!file) {
            alert('Please select a file to submit.');
            return;
        }
        
        try {
            // Upload file to storage
            const fileName = `${currentUser.id}/${assignmentId}/${Date.now()}_${file.name}`;
            const uploadResult = await uploadFile(STORAGE_BUCKETS.SUBMISSIONS, file, fileName);
            
            if (!uploadResult) {
                alert('Error uploading file. Please try again.');
                return;
            }
            
            // Save submission record
            const { error } = await supabase
                .from('submissions')
                .insert([
                    {
                        assignment_id: assignmentId,
                        student_id: currentUser.id,
                        file_path: fileName
                    }
                ]);
            
            if (error) {
                console.error('Error saving submission:', error);
                alert('Error saving submission. Please try again.');
                return;
            }
            
            alert('Assignment submitted successfully!');
            submissionModal.style.display = 'none';
            submissionForm.reset();
            loadAssignments(); // Reload assignments
            
        } catch (error) {
            console.error('Submission error:', error);
            alert('Error submitting assignment. Please try again.');
        }
    });
    
    // Quiz modal
    const quizModal = document.getElementById('quizModal');
    const quizForm = document.getElementById('quizForm');
    
    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const quizId = document.getElementById('quizId').value;
        const selectedAnswer = document.querySelector('input[name="quizAnswer"]:checked');
        
        if (!selectedAnswer) {
            alert('Please select an answer.');
            return;
        }
        
        const selectedIndex = parseInt(selectedAnswer.value);
        
        try {
            // Get quiz details to check correct answer
            const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .select('correct_index')
                .eq('id', quizId)
                .single();
            
            if (quizError) {
                console.error('Error fetching quiz:', quizError);
                alert('Error processing quiz. Please try again.');
                return;
            }
            
            const isCorrect = selectedIndex === quiz.correct_index;
            
            // Save quiz result
            const { error } = await supabase
                .from('quiz_results')
                .insert([
                    {
                        quiz_id: quizId,
                        student_id: currentUser.id,
                        selected_index: selectedIndex,
                        is_correct: isCorrect
                    }
                ]);
            
            if (error) {
                console.error('Error saving quiz result:', error);
                alert('Error saving quiz result. Please try again.');
                return;
            }
            
            alert(isCorrect ? 'Correct! Well done!' : 'Incorrect. Better luck next time!');
            quizModal.style.display = 'none';
            quizForm.reset();
            loadQuizzes(); // Reload quizzes
            
        } catch (error) {
            console.error('Quiz submission error:', error);
            alert('Error submitting quiz. Please try again.');
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