document.addEventListener('DOMContentLoaded', () => {

    // CONSTANTS
    const USERS_KEY = 'users';
    const LOGGED_USER_KEY = 'loggedUser';
    const POSTS_KEY = 'posts';

    // Page Detection
    const path = window.location.pathname;
    const isFeedPage = path.includes('feed.html');
    const isIndexPage = path.includes('index.html') || path.endsWith('/');

    // Auth Check
    const loggedUser = JSON.parse(localStorage.getItem(LOGGED_USER_KEY));

    if (isFeedPage && !loggedUser) {
        window.location.href = 'index.html';
        return;
    }
    if (isIndexPage && loggedUser) {
        window.location.href = 'feed.html';
        return;
    }

    // --- AUTH PAGE LOGIC ---
    if (isIndexPage) {
        const loginBox = document.getElementById('loginBox');
        const loginSwitch = document.getElementById('loginSwitch');
        const signupBox = document.getElementById('signupBox');
        const signupSwitch = document.getElementById('signupSwitch');

        // Toggle Forms
        document.getElementById('showSignup').addEventListener('click', (e) => {
            e.preventDefault();
            loginBox.classList.add('hidden');
            loginSwitch.classList.add('hidden');
            signupBox.classList.remove('hidden');
            signupSwitch.classList.remove('hidden');
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            signupBox.classList.add('hidden');
            signupSwitch.classList.add('hidden');
            loginBox.classList.remove('hidden');
            loginSwitch.classList.remove('hidden');
        });

        // --- SIGNUP LOGIC (With Image Upload) ---
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('signupEmail').value;
            const name = document.getElementById('signupName').value;
            const pass = document.getElementById('signupPass').value;
            const fileInput = document.getElementById('signupImg');
            
            const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

            if (users.some(u => u.email === email)) {
                Swal.fire('Error', 'User already exists', 'error');
                return;
            }

            // Function to save user
            const saveUser = (profilePicBase64) => {
                users.push({ 
                    email, 
                    name, 
                    pass, 
                    profilePic: profilePicBase64 || null // Save image or null
                });
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
                
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Account created! Log in now.',
                });
                document.getElementById('showLogin').click();
                document.getElementById('signupForm').reset();
            };

            // Check if user selected an image
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    saveUser(e.target.result); // Save with Base64 Image string
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                saveUser(null); // Save without image
            }
        });

        // --- LOGIN LOGIC ---
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPass').value;

            const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
            const user = users.find(u => u.email === email && u.pass === pass);

            if (user) {
                localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(user));
                window.location.href = 'feed.html';
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Sorry",
                    text: "your password was incorrect.",
                });
            }
        });
    }

    // --- FEED PAGE LOGIC ---
    if (isFeedPage) {

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem(LOGGED_USER_KEY);
            window.location.href = 'index.html';
        });

        // Create Post
        document.getElementById('publishBtn').addEventListener('click', () => {
            const text = document.getElementById('postText').value;
            const img = document.getElementById('postImg').value;

            if (!text && !img) return;

            const newPost = {
                id: Date.now(),
                text,
                img,
                likes: 0,
                likedBy: [],
                user: loggedUser.name,
                email: loggedUser.email,
                userProfilePic: loggedUser.profilePic, // Save current user's pic
                date: new Date().toISOString()
            };

            const posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
            posts.unshift(newPost);
            localStorage.setItem(POSTS_KEY, JSON.stringify(posts));

            document.getElementById('postText').value = '';
            document.getElementById('postImg').value = '';
            renderPosts();
        });

        // Event Listeners for Search and Sort
        document.getElementById('searchInput').addEventListener('input', renderPosts);
        document.getElementById('sortSelect').addEventListener('change', renderPosts);

        renderPosts();
    }

    // --- RENDER POSTS FUNCTION (Handles Search & Sort) ---
    function renderPosts() {
        const container = document.getElementById('feedContainer');
        if (!container) return;

        container.innerHTML = '';
        let posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
        
        // 1. SEARCH FILTER
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if(searchTerm) {
            posts = posts.filter(post => 
                (post.text && post.text.toLowerCase().includes(searchTerm)) || 
                (post.user && post.user.toLowerCase().includes(searchTerm))
            );
        }

        // 2. SORTING
        const sortValue = document.getElementById('sortSelect').value;
        if(sortValue === 'newest') {
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else {
            posts.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        // 3. RENDER LOOP
        posts.forEach(post => {
            const isOwner = post.email === loggedUser.email;
            const hasLiked = post.likedBy && post.likedBy.includes(loggedUser.email);
            
            // Logic to show User Profile Pic or Default Grey Circle
            let avatarHTML = '';
            if (post.userProfilePic) {
                avatarHTML = `<img src="${post.userProfilePic}" class="avatar-img">`;
            } else {
                avatarHTML = `<div class="avatar"></div>`; // Default
            }

            const div = document.createElement('div');
            div.className = 'post-card';
            div.innerHTML = `
                <div class="post-header">
                    <div class="user-profile">
                        ${avatarHTML}
                        <div class="username">${post.user}</div>
                        <div class="time">• ${timeAgo(post.date)}</div>
                    </div>
                    ${isOwner ? `<button onclick="deletePost(${post.id})" class="delete-btn">Delete</button>` : '<div>...</div>'}
                </div>
                
                ${post.img ? `<img src="${post.img}" class="post-img" onerror="this.style.display='none'">` : ''}
                
                <div class="post-actions">
                    <button onclick="likePost(${post.id})" class="action-btn">
                        <span class="${hasLiked ? 'liked-heart' : ''}">${hasLiked ? '❤️' : '🤍'}</span>
                    </button>
                    <button class="action-btn">💬</button>
                    <button class="action-btn">🚀</button>
                </div>
                
                <div class="likes-count">${post.likes} likes</div>
                <div class="caption">
                    <span>${post.user}</span> ${post.text}
                </div>
            `;
            container.appendChild(div);
        });
    }

    // Helper for Time
    function timeAgo(dateString) {
        const diff = new Date() - new Date(dateString);
        const min = Math.floor(diff / 60000);
        if (min < 60) return min + 'm';
        const hour = Math.floor(min / 60);
        if (hour < 24) return hour + 'h';
        return Math.floor(hour / 24) + 'd';
    }

    // Global Functions for HTML Buttons

    window.likePost = function (id) {
        const loggedUser = JSON.parse(localStorage.getItem(LOGGED_USER_KEY));
        let posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
        const postIndex = posts.findIndex(p => p.id === id);

        if (postIndex > -1) {
            let post = posts[postIndex];
            if (!post.likedBy) post.likedBy = [];

            if (post.likedBy.includes(loggedUser.email)) {
                post.likes--;
                post.likedBy = post.likedBy.filter(email => email !== loggedUser.email);
            } else {
                post.likes++;
                post.likedBy.push(loggedUser.email);
            }
            posts[postIndex] = post;
            localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
            renderPosts();
        }
    };

    window.deletePost = function (id) {
        Swal.fire({
            title: 'Delete Post?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: '#262626',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                let posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
                posts = posts.filter(p => p.id !== id);
                localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
                renderPosts();
                Swal.fire('Deleted!', 'Your post has been deleted.', 'success');
            }
        });
    };
});