// Authentication JavaScript

// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (user) {
        // User is logged in, redirect to appropriate dashboard
        const profile = await getUserProfile(user.id);
        if (profile) {
            if (profile.role === 'student') {
                window.location.href = 'student.html';
            } else if (profile.role === 'teacher') {
                window.location.href = 'teacher.html';
            }
        }
    }
});

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Sign in with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                showMessage('message', error.message, 'error');
                return;
            }
            
            // Get user profile to determine role
            const profile = await getUserProfile(data.user.id);
            if (!profile) {
                showMessage('message', 'Profile not found. Please contact administrator.', 'error');
                return;
            }
            
            // Redirect based on role
            if (profile.role === 'student') {
                window.location.href = 'student.html';
            } else if (profile.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else {
                showMessage('message', 'Invalid user role.', 'error');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showMessage('message', 'An error occurred during login.', 'error');
        }
    });
}

// Signup Form Handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        try {
            // Sign up with Supabase
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });
            
            if (error) {
                showMessage('message', error.message, 'error');
                return;
            }
            
            if (data.user) {
                // Create profile record
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: data.user.id,
                            full_name: fullName,
                            role: role
                        }
                    ]);
                
                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    showMessage('message', 'Account created but profile setup failed. Please contact administrator.', 'error');
                    return;
                }
                
                showMessage('message', 'Account created successfully! Please check your email for verification.', 'success');
                
                // Clear form
                signupForm.reset();
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }
            
        } catch (error) {
            console.error('Signup error:', error);
            showMessage('message', 'An error occurred during signup.', 'error');
        }
    });
}

// Logout function (used in dashboard pages)
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

// Auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    
    if (event === 'SIGNED_OUT') {
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('index.html') && 
            !window.location.pathname.includes('signup.html') &&
            window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});