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
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Global Variables
let currentUser = null;
let currentEditingNoteId = null;
let allNotes = [];

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

        renderNotes();
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

function renderNotes() {
    const container = document.getElementById('notesContainer');

    if (allNotes.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-20">
                <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#1f6feb] to-[#58a6ff] rounded-2xl mb-6 shadow-2xl shadow-blue-500/20">
                    <i class="fas fa-sticky-note text-4xl text-white"></i>
                </div>
                <p class="text-2xl font-bold text-[#e6edf3] mb-3">No notes yet</p>
                <p class="text-base text-[#7d8590] mb-6">Click "New Note" to create your first note</p>
                <button onclick="openAddNoteModal()" class="px-6 py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/20">
                    <i class="fas fa-plus mr-2"></i>Create Your First Note
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = allNotes.map(note => createNoteCard(note)).join('');
}

function createNoteCard(note) {
    const date = note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'Recent';
    
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
                    <p class="text-xs text-[#6e7681] font-medium">${date}</p>
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
    document.getElementById('viewNoteDate').textContent =
        note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'Recent';

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

// Export global functions
window.currentViewingNoteId = null;
window.currentEditingNoteId = null;
