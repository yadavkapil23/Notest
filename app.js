// Simple Note-Taking App
import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    Timestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    deleteUser
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Global Variables
let currentUser = null;
let currentEditingNoteId = null;
let allNotes = [];
let filteredNotes = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');

    // Auth State Observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            showApp();
            loadNotes();
        } else {
            currentUser = null;
            showAuth();
        }
    });

    // Form Listeners
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    document.getElementById('noteForm').addEventListener('submit', handleSaveNote);
    
    // Search and Filter Listeners
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    const sizeFilter = document.getElementById('sizeFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
    if (sizeFilter) {
        sizeFilter.addEventListener('change', applyFilters);
    }
});

// ============ Authentication ============

async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        showLoading('Creating account...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        showToast('Account created successfully!', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Registration error:', error);
        showToast(getErrorMessage(error.code), 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        showLoading('Signing in...');
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome back!', 'success');
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showToast(getErrorMessage(error.code), 'error');
    }
}

window.handleLogout = async function () {
    try {
        await signOut(auth);
        showToast('Logged out successfully', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
};

// ============ Load Notes ============

async function loadNotes() {
    try {
        showLoading('Loading notes...');

        // Update user display
        document.getElementById('userNameDisplay').textContent =
            currentUser.displayName || currentUser.email;

        // Load all notes
        const notesRef = collection(db, 'notes');
        const q = query(
            notesRef,
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        allNotes = [];

        querySnapshot.forEach((doc) => {
            allNotes.push({ id: doc.id, ...doc.data() });
        });

        filteredNotes = [...allNotes];
        applyFilters();
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading notes:', error);
        
        // Check if it's a blocked connection error
        if (error.message && error.message.includes('blocked') || error.code === 'unavailable') {
            showToast('Connection blocked. Please disable ad blockers for this site.', 'error');
        } else {
            showToast('Error loading notes: ' + error.message, 'error');
        }
    }
}

// ============ Save Note ============

async function handleSaveNote(e) {
    e.preventDefault();

    const title = document.getElementById('noteTitle').value.trim();
    const contentType = document.querySelector('input[name="contentType"]:checked')?.value || 'text';
    const isPriority = false; // Keep for DB compatibility but don't use

    if (!title) {
        showToast('Title is required', 'error');
        return;
    }

    try {
        showLoading('Saving note...');

        let content = '';
        let fileUrl = null;
        let fileData = null;
        let subject = 'General'; // Keep for DB compatibility

        // Handle different content types
        if (contentType === 'text') {
            content = document.getElementById('noteTextContent').value.trim();
            if (!content) {
                showToast('Please enter some content', 'error');
                hideLoading();
                return;
            }
        } else if (contentType === 'code') {
            const code = document.getElementById('noteCodeContent').value.trim();
            const language = document.getElementById('codeLanguage').value.trim();
            if (!code) {
                showToast('Please enter code', 'error');
                hideLoading();
                return;
            }
            content = code;
            fileData = { language };
        } else if (contentType === 'image') {
            const imageFile = document.getElementById('imageUpload').files[0];
            if (!imageFile) {
                showToast('Please select an image', 'error');
                hideLoading();
                return;
            }

            // Check file size (1MB limit)
            if (imageFile.size > 1024 * 1024) {
                showToast('Image must be under 1MB. Please resize it and try again.', 'error');
                hideLoading();
                return;
            }

            // Convert image to base64
            fileUrl = await convertFileToBase64(imageFile);
            fileData = {
                fileName: imageFile.name,
                fileSize: formatFileSize(imageFile.size),
                mimeType: imageFile.type
            };
        }

        const noteData = {
            title,
            subject,
            contentType,
            content,
            fileUrl,
            fileData,
            isPriority,
            userId: currentUser.uid,
            updatedAt: Timestamp.now()
        };

        if (window.currentEditingNoteId) {
            // Update existing note
            const noteRef = doc(db, 'notes', window.currentEditingNoteId);
            await updateDoc(noteRef, noteData);
            showToast('Note updated successfully!', 'success');
        } else {
            // Create new note
            noteData.createdAt = Timestamp.now();
            await addDoc(collection(db, 'notes'), noteData);
            showToast('Note created successfully!', 'success');
        }

        hideLoading();
        closeNoteModal();
        loadNotes();
    } catch (error) {
        hideLoading();
        console.error('Error saving note:', error);
        
        // Check if it's a blocked connection error
        if (error.message && (error.message.includes('blocked') || error.message.includes('network'))) {
            showToast('Connection blocked. Please disable ad blockers for this site.', 'error');
        } else {
            showToast('Error saving note: ' + error.message, 'error');
        }
    }
}

// Convert file to base64 string
async function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============ Edit Note ============

window.editNote = async function (noteId) {
    window.currentEditingNoteId = noteId;
    const note = allNotes.find(n => n.id === noteId);

    if (!note) return;

    // Populate form
    document.getElementById('noteTitle').value = note.title;
    const contentTypeRadio = document.querySelector(`input[name="contentType"][value="${note.contentType || 'text'}"]`);
    if (contentTypeRadio) {
        contentTypeRadio.checked = true;
    }
    handleContentTypeChange();

    if (note.contentType === 'text') {
        document.getElementById('noteTextContent').value = note.content;
    } else if (note.contentType === 'code') {
        document.getElementById('noteCodeContent').value = note.content;
        document.getElementById('codeLanguage').value = note.fileData?.language || '';
    } else if (note.contentType === 'image') {
        // For images, we can't restore the file input, but we can show the existing image
        const preview = document.getElementById('imagePreview');
        if (note.fileUrl) {
            preview.querySelector('img').src = note.fileUrl;
            preview.classList.remove('hidden');
        }
    }

    document.getElementById('modalTitle').textContent = 'Edit Note';
    closeViewNoteModal();
    openAddNoteModal();
};

// ============ Delete Note ============

window.deleteNote = async function (noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        showLoading('Deleting note...');
        await deleteDoc(doc(db, 'notes', noteId));
        showToast('Note deleted successfully', 'success');
        hideLoading();
        closeViewNoteModal();
        loadNotes();
    } catch (error) {
        hideLoading();
        console.error('Error deleting note:', error);
        showToast('Error deleting note', 'error');
    }
};

// ============ Render Notes ============

// ============ Search and Filter ============

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    const sizeFilter = document.getElementById('sizeFilter')?.value || 'all';
    
    // Size filter (based on total notes count) - check first
    if (sizeFilter !== 'all') {
        const totalNotes = allNotes.length;
        let shouldShow = false;
        
        switch (sizeFilter) {
            case 'small':
                shouldShow = totalNotes >= 1 && totalNotes <= 5;
                break;
            case 'medium':
                shouldShow = totalNotes >= 6 && totalNotes <= 15;
                break;
            case 'large':
                shouldShow = totalNotes >= 16;
                break;
        }
        
        if (!shouldShow) {
            filteredNotes = [];
            renderNotes();
            return;
        }
    }
    
    // Apply search and date filters
    filteredNotes = allNotes.filter(note => {
        // Search filter
        if (searchTerm) {
            const matchesTitle = note.title?.toLowerCase().includes(searchTerm);
            const matchesContent = note.content?.toLowerCase().includes(searchTerm);
            if (!matchesTitle && !matchesContent) return false;
        }
        
        // Date filter
        if (dateFilter !== 'all') {
            const noteDate = note.createdAt?.toDate ? note.createdAt.toDate() : new Date();
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            switch (dateFilter) {
                case 'today':
                    if (noteDate < today) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    if (noteDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    if (noteDate < monthAgo) return false;
                    break;
                case 'year':
                    const yearAgo = new Date(today);
                    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                    if (noteDate < yearAgo) return false;
                    break;
            }
        }
        
        return true;
    });
    
    // Show/hide clear filters button
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        if (searchTerm || dateFilter !== 'all' || sizeFilter !== 'all') {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
    
    renderNotes();
}

window.clearFilters = function() {
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFilter').value = 'all';
    document.getElementById('sizeFilter').value = 'all';
    applyFilters();
};

function renderNotes() {
    const container = document.getElementById('notesContainer');
    const notesToRender = filteredNotes.length > 0 ? filteredNotes : allNotes;

    if (notesToRender.length === 0) {
        const hasFilters = document.getElementById('searchInput')?.value || 
                          document.getElementById('dateFilter')?.value !== 'all' ||
                          document.getElementById('sizeFilter')?.value !== 'all';
        
        container.innerHTML = `
            <div class="col-span-full text-center py-20">
                <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#1f6feb] to-[#58a6ff] rounded-2xl mb-6 shadow-2xl shadow-blue-500/20">
                    <i class="fas ${hasFilters ? 'fa-search' : 'fa-sticky-note'} text-4xl text-white"></i>
                </div>
                <p class="text-2xl font-bold text-[#e6edf3] mb-3">${hasFilters ? 'No notes found' : 'No notes yet'}</p>
                <p class="text-base text-[#7d8590] mb-6">${hasFilters ? 'Try adjusting your filters' : 'Click "New Note" to create your first note'}</p>
                ${hasFilters ? 
                    `<button onclick="clearFilters()" class="px-6 py-3 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] font-semibold rounded-lg transition-all border border-[#30363d]">
                        <i class="fas fa-times mr-2"></i>Clear Filters
                    </button>` :
                    `<button onclick="openAddNoteModal()" class="px-6 py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/20">
                        <i class="fas fa-plus mr-2"></i>Create Your First Note
                    </button>`
                }
            </div>
        `;
        return;
    }

    container.innerHTML = notesToRender.map(note => createNoteCard(note)).join('');
}

function createNoteCard(note) {
    const createdDate = note.createdAt?.toDate ? note.createdAt.toDate() : null;
    const updatedDate = note.updatedAt?.toDate ? note.updatedAt.toDate() : null;
    
    let dateDisplay = 'Recent';
    let lastEdited = '';
    
    if (createdDate) {
        dateDisplay = createdDate.toLocaleDateString();
    }
    
    if (updatedDate && createdDate && updatedDate.getTime() !== createdDate.getTime()) {
        const timeDiff = Date.now() - updatedDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
            lastEdited = '<span class="text-[#7ee787] text-xs">Edited today</span>';
        } else if (daysDiff === 1) {
            lastEdited = '<span class="text-[#7ee787] text-xs">Edited yesterday</span>';
        } else if (daysDiff < 7) {
            lastEdited = `<span class="text-[#7ee787] text-xs">Edited ${daysDiff} days ago</span>`;
        } else {
            lastEdited = `<span class="text-[#7ee787] text-xs">Edited ${updatedDate.toLocaleDateString()}</span>`;
        }
    }
    
    const iconConfig = {
        text: { icon: 'fa-file-alt', color: '#58a6ff', bg: 'from-blue-500/20 to-blue-600/20', border: '#30363d' },
        code: { icon: 'fa-code', color: '#7ee787', bg: 'from-green-500/20 to-green-600/20', border: '#30363d' },
        image: { icon: 'fa-image', color: '#f85149', bg: 'from-red-500/20 to-red-600/20', border: '#30363d' }
    };
    
    const config = iconConfig[note.contentType] || iconConfig.text;

    const preview = note.contentType === 'text' 
        ? `<p class="text-[#7d8590] line-clamp-3 mt-3 text-sm leading-relaxed">${escapeHtml(note.content.substring(0, 120))}${note.content.length > 120 ? '...' : ''}</p>`
        : note.contentType === 'code'
        ? `<div class="mt-3 flex items-center gap-2 flex-wrap">
            <span class="px-2.5 py-1 bg-gradient-to-r ${config.bg} text-[#7ee787] rounded-md text-xs font-semibold border border-[#30363d]">Code</span>
            ${note.fileData?.language ? `<span class="px-2.5 py-1 bg-[#21262d] text-[#7d8590] rounded-md text-xs font-medium border border-[#30363d]">${escapeHtml(note.fileData.language)}</span>` : ''}
          </div>`
        : `<div class="mt-3">
            <span class="px-2.5 py-1 bg-gradient-to-r ${config.bg} text-[#f85149] rounded-md text-xs font-semibold border border-[#30363d]">Image</span>
          </div>`;

    return `
        <div class="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#1f6feb] transition-all cursor-pointer group card-glow" onclick="viewNote('${note.id}')">
            <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br ${config.bg} border border-[#30363d] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <i class="fas ${config.icon} text-xl" style="color: ${config.color}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-base font-bold text-[#e6edf3] mb-1.5 line-clamp-2 group-hover:text-[#58a6ff] transition-colors">${escapeHtml(note.title)}</h3>
                    <p class="text-xs text-[#6e7681] font-medium">Created: ${dateDisplay}</p>
                    ${lastEdited ? `<p class="text-xs mt-1">${lastEdited}</p>` : ''}
                </div>
            </div>
            ${preview}
            <div class="mt-4 pt-4 border-t border-[#21262d] flex items-center justify-between">
                <span class="text-xs text-[#6e7681]">Click to view</span>
                <i class="fas fa-arrow-right text-xs text-[#7d8590] group-hover:text-[#58a6ff] group-hover:translate-x-1 transition-all"></i>
            </div>
        </div>
    `;
}

// ============ View Note ============

window.viewNote = async function (noteId) {
    window.currentViewingNoteId = noteId;
    const note = allNotes.find(n => n.id === noteId);

    if (!note) return;

    document.getElementById('viewNoteTitle').textContent = note.title;
    
    const createdDate = note.createdAt?.toDate ? note.createdAt.toDate() : null;
    const updatedDate = note.updatedAt?.toDate ? note.updatedAt.toDate() : null;
    
    let dateText = 'Recent';
    if (createdDate) {
        dateText = `Created: ${createdDate.toLocaleDateString()}`;
        if (updatedDate && createdDate && updatedDate.getTime() !== createdDate.getTime()) {
            dateText += ` • Last edited: ${updatedDate.toLocaleDateString()}`;
        }
    }
    document.getElementById('viewNoteDate').textContent = dateText;

    let contentHtml = '';

    if (note.contentType === 'text') {
        contentHtml = `<div class="prose prose-invert max-w-none">
           <p class="whitespace-pre-wrap text-[#e6edf3] leading-relaxed text-base">${escapeHtml(note.content)}</p>
        </div>`;
    } else if (note.contentType === 'code') {
        contentHtml = `
            ${note.fileData?.language ? `<div class="mb-5 px-4 py-2.5 bg-gradient-to-r from-[#238636]/20 to-[#2ea043]/20 border border-[#30363d] rounded-lg inline-flex items-center space-x-3 shadow-lg">
                <i class="fas fa-code text-[#7ee787] text-lg"></i>
                <span class="text-sm font-semibold text-[#e6edf3]">${escapeHtml(note.fileData.language)}</span>
            </div>` : ''}
            <div class="bg-[#010409] border border-[#30363d] rounded-xl p-5 overflow-x-auto mt-4 shadow-2xl code-block">
                <pre class="text-[#7ee787] font-mono text-sm leading-relaxed"><code>${escapeHtml(note.content)}</code></pre>
            </div>
            <button onclick="copyToClipboard('${escapeHtml(note.content).replace(/'/g, "\\'")}')" 
                class="mt-5 px-5 py-2.5 bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-all border border-[#30363d] text-[#7ee787] hover:text-[#9ef0a0] text-sm font-semibold transform hover:scale-105">
                <i class="fas fa-copy mr-2"></i>Copy Code
            </button>
        `;
    } else if (note.contentType === 'image') {
        contentHtml = `
            ${note.fileData?.fileName ? `<div class="mb-5 px-4 py-2.5 bg-gradient-to-r from-[#da3633]/20 to-[#f85149]/20 border border-[#30363d] rounded-lg shadow-lg">
                <p class="text-sm text-[#e6edf3] font-semibold"><i class="fas fa-file-image mr-2 text-[#f85149]"></i>${escapeHtml(note.fileData.fileName)}</p>
                ${note.fileData?.fileSize ? `<p class="text-xs text-[#7d8590] mt-1.5">${escapeHtml(note.fileData.fileSize)}</p>` : ''}
            </div>` : ''}
            <div class="flex justify-center">
                <img src="${note.fileUrl}" alt="${escapeHtml(note.title)}" class="max-w-full h-auto rounded-xl border border-[#30363d] shadow-2xl">
            </div>
        `;
    }

    document.getElementById('viewNoteContent').innerHTML = contentHtml;
    document.getElementById('viewNoteModal').classList.remove('hidden');
    document.getElementById('viewNoteModal').classList.add('active');
};

// ============ Helper Functions ============

function showAuth() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
}

function showApp() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
}

function getErrorMessage(code) {
    const errors = {
        'auth/email-already-in-use': 'Email already in use',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password is too weak',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection'
    };
    return errors[code] || 'An error occurred. Please try again';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============ Analytics Dashboard ============

window.openAnalyticsModal = function() {
    const modal = document.getElementById('analyticsModal');
    const content = document.getElementById('analyticsContent');
    
    // Calculate statistics
    const totalNotes = allNotes.length;
    const textNotes = allNotes.filter(n => n.contentType === 'text').length;
    const codeNotes = allNotes.filter(n => n.contentType === 'code').length;
    const imageNotes = allNotes.filter(n => n.contentType === 'image').length;
    
    // Content type distribution
    const contentTypeData = [
        { type: 'Text', count: textNotes, color: '#58a6ff', icon: 'fa-file-alt' },
        { type: 'Code', count: codeNotes, color: '#7ee787', icon: 'fa-code' },
        { type: 'Image', count: imageNotes, color: '#f85149', icon: 'fa-image' }
    ];
    
    // Date statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    
    const notesToday = allNotes.filter(n => {
        const date = n.createdAt?.toDate ? n.createdAt.toDate() : null;
        return date && date >= today;
    }).length;
    
    const notesThisWeek = allNotes.filter(n => {
        const date = n.createdAt?.toDate ? n.createdAt.toDate() : null;
        return date && date >= thisWeek;
    }).length;
    
    const notesThisMonth = allNotes.filter(n => {
        const date = n.createdAt?.toDate ? n.createdAt.toDate() : null;
        return date && date >= thisMonth;
    }).length;
    
    // Most used languages
    const languages = {};
    allNotes.forEach(note => {
        if (note.contentType === 'code' && note.fileData?.language) {
            const lang = note.fileData.language;
            languages[lang] = (languages[lang] || 0) + 1;
        }
    });
    const topLanguages = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // Average notes per day (if account exists for more than a day)
    const oldestNote = allNotes.reduce((oldest, note) => {
        const date = note.createdAt?.toDate ? note.createdAt.toDate() : null;
        if (!date) return oldest;
        if (!oldest) return date;
        return date < oldest ? date : oldest;
    }, null);
    
    let avgNotesPerDay = 0;
    if (oldestNote) {
        const daysDiff = Math.max(1, Math.ceil((now - oldestNote) / (1000 * 60 * 60 * 24)));
        avgNotesPerDay = (totalNotes / daysDiff).toFixed(2);
    }
    
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Overview Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-[#0d1117] border border-[#30363d] rounded-xl p-5">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-[#7d8590]">Total Notes</span>
                        <i class="fas fa-sticky-note text-[#58a6ff]"></i>
                    </div>
                    <p class="text-3xl font-bold text-[#e6edf3]">${totalNotes}</p>
                </div>
                <div class="bg-[#0d1117] border border-[#30363d] rounded-xl p-5">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-[#7d8590]">This Week</span>
                        <i class="fas fa-calendar-week text-[#7ee787]"></i>
                    </div>
                    <p class="text-3xl font-bold text-[#e6edf3]">${notesThisWeek}</p>
                </div>
                <div class="bg-[#0d1117] border border-[#30363d] rounded-xl p-5">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-[#7d8590]">This Month</span>
                        <i class="fas fa-calendar-alt text-[#f85149]"></i>
                    </div>
                    <p class="text-3xl font-bold text-[#e6edf3]">${notesThisMonth}</p>
                </div>
                <div class="bg-[#0d1117] border border-[#30363d] rounded-xl p-5">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-[#7d8590]">Avg/Day</span>
                        <i class="fas fa-chart-line text-[#79c0ff]"></i>
                    </div>
                    <p class="text-3xl font-bold text-[#e6edf3]">${avgNotesPerDay}</p>
                </div>
            </div>
            
            <!-- Content Type Distribution -->
            <div class="bg-[#0d1117] border border-[#30363d] rounded-xl p-6">
                <h4 class="text-lg font-bold text-[#e6edf3] mb-4">Content Type Distribution</h4>
                <div class="space-y-3">
                    ${contentTypeData.map(item => {
                        const percentage = totalNotes > 0 ? ((item.count / totalNotes) * 100).toFixed(1) : 0;
                        return `
                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2">
                                        <i class="fas ${item.icon}" style="color: ${item.color}"></i>
                                        <span class="text-sm font-semibold text-[#e6edf3]">${item.type}</span>
                                    </div>
                                    <span class="text-sm text-[#7d8590]">${item.count} (${percentage}%)</span>
                                </div>
                                <div class="w-full bg-[#161b22] rounded-full h-2">
                                    <div class="h-2 rounded-full transition-all" style="width: ${percentage}%; background: ${item.color}"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Top Languages -->
            ${topLanguages.length > 0 ? `
                <div class="bg-[#0d1117] border border-[#30363d] rounded-xl p-6">
                    <h4 class="text-lg font-bold text-[#e6edf3] mb-4">Most Used Languages</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${topLanguages.map(([lang, count]) => `
                            <div class="flex items-center justify-between p-3 bg-[#161b22] rounded-lg border border-[#30363d]">
                                <span class="text-sm font-semibold text-[#e6edf3]">${escapeHtml(lang)}</span>
                                <span class="text-sm text-[#7d8590]">${count} note${count !== 1 ? 's' : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Recent Activity -->
            <div class="bg-[#0d1117] border border-[#30363d] rounded-xl p-6">
                <h4 class="text-lg font-bold text-[#e6edf3] mb-4">Recent Activity</h4>
                <div class="space-y-2 text-sm text-[#7d8590]">
                    <p>• ${notesToday} note${notesToday !== 1 ? 's' : ''} created today</p>
                    <p>• ${notesThisWeek} note${notesThisWeek !== 1 ? 's' : ''} created this week</p>
                    <p>• ${notesThisMonth} note${notesThisMonth !== 1 ? 's' : ''} created this month</p>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
};

window.closeAnalyticsModal = function() {
    const modal = document.getElementById('analyticsModal');
    modal.classList.add('hidden');
    modal.classList.remove('active');
};

// ============ Account Deletion ============

window.openDeleteAccountModal = function() {
    document.getElementById('deleteAccountModal').classList.remove('hidden');
    document.getElementById('deleteConfirmInput').value = '';
};

window.closeDeleteAccountModal = function() {
    document.getElementById('deleteAccountModal').classList.add('hidden');
    document.getElementById('deleteConfirmInput').value = '';
};

window.confirmDeleteAccount = async function() {
    const confirmText = document.getElementById('deleteConfirmInput').value.trim();
    
    if (confirmText !== 'DELETE') {
        showToast('Please type "DELETE" to confirm', 'error');
        return;
    }
    
    if (!confirm('This will permanently delete your account and all notes. This cannot be undone. Continue?')) {
        return;
    }
    
    try {
        showLoading('Deleting account and all notes...');
        
        // Delete all user's notes
        const notesRef = collection(db, 'notes');
        const q = query(notesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnapshot) => {
            batch.delete(doc(db, 'notes', docSnapshot.id));
        });
        await batch.commit();
        
        // Delete user account
        await deleteUser(currentUser);
        
        hideLoading();
        showToast('Account deleted successfully', 'success');
        
        // User will be automatically signed out
    } catch (error) {
        hideLoading();
        console.error('Error deleting account:', error);
        
        if (error.code === 'auth/requires-recent-login') {
            showToast('Please log out and log back in before deleting your account', 'error');
        } else {
            showToast('Error deleting account: ' + error.message, 'error');
        }
    }
};

// ============ User Menu Toggle ============

window.toggleUserMenu = function() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
};

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    const button = e.target.closest('[onclick="toggleUserMenu()"]');
    if (menu && !menu.contains(e.target) && !button) {
        menu.classList.add('hidden');
    }
});

// Export global functions
window.currentViewingNoteId = null;
window.currentEditingNoteId = null;
