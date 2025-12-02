// Simple UI Helper Functions

let loadingOverlay = null;
let toastTimeout = null;

// ============ Modal Functions ============

function toggleAuthForms() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('registerForm').classList.toggle('hidden');
}

function openAddNoteModal() {
    document.getElementById('noteModal').classList.remove('hidden');
    document.getElementById('noteModal').classList.add('active');

    if (!window.currentEditingNoteId) {
        document.getElementById('modalTitle').textContent = 'New Note';
        resetNoteForm();
    }
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.add('hidden');
    document.getElementById('noteModal').classList.remove('active');
    resetNoteForm();
    window.currentEditingNoteId = null;
}

function closeViewNoteModal() {
    document.getElementById('viewNoteModal').classList.add('hidden');
    document.getElementById('viewNoteModal').classList.remove('active');
}

function resetNoteForm() {
    document.getElementById('noteForm').reset();

    // Reset file previews
    document.getElementById('imagePreview').classList.add('hidden');
    
    // Clear file inputs
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) imageUpload.value = '';
}

// ============ Content Type Handling ============

function handleContentTypeChange() {
    // no-op: legacy function kept for backward compatibility
}

// ============ File Preview ============

function handleFilePreview(input, previewId) {
    const file = input.files[0];
    if (!file) return;

    const previewElement = document.getElementById(previewId);

    if (previewId === 'imagePreview') {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewElement.querySelector('img').src = e.target.result;
            previewElement.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

// ============ Loading Overlay ============

function showLoading(message = 'Loading...') {
    hideLoading();

    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center';
    loadingOverlay.innerHTML = `
        <div class="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 flex flex-col items-center space-y-4">
            <div class="spinner"></div>
            <p class="text-gray-300 font-medium">${message}</p>
        </div>
    `;

    document.body.appendChild(loadingOverlay);
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.remove();
        loadingOverlay = null;
    }
    document.body.style.overflow = '';
}

// ============ Toast Notifications ============

function showToast(message, type = 'info') {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    clearTimeout(toastTimeout);

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<i class="fas fa-check-circle text-green-400 text-xl"></i>',
        error: '<i class="fas fa-exclamation-circle text-red-400 text-xl"></i>',
        info: '<i class="fas fa-info-circle text-blue-400 text-xl"></i>'
    };

    toast.innerHTML = `
        ${icons[type] || icons.info}
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-2 text-gray-400 hover:text-gray-300">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(toast);

    toastTimeout = setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ============ Copy to Clipboard ============

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// ============ Keyboard Shortcuts ============

document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        if (!document.getElementById('noteModal').classList.contains('hidden')) {
            closeNoteModal();
        }
        if (!document.getElementById('viewNoteModal').classList.contains('hidden')) {
            closeViewNoteModal();
        }
        if (!document.getElementById('analyticsModal').classList.contains('hidden')) {
            closeAnalyticsModal();
        }
        if (!document.getElementById('deleteAccountModal').classList.contains('hidden')) {
            closeDeleteAccountModal();
        }
    }
});

// ============ Click Outside to Close Modals ============

document.getElementById('noteModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'noteModal') {
        closeNoteModal();
    }
});

document.getElementById('viewNoteModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'viewNoteModal') {
        closeViewNoteModal();
    }
});

document.getElementById('analyticsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'analyticsModal') {
        closeAnalyticsModal();
    }
});

document.getElementById('deleteAccountModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'deleteAccountModal') {
        closeDeleteAccountModal();
    }
});

// ============ Export Functions ============

window.toggleAuthForms = toggleAuthForms;
window.openAddNoteModal = openAddNoteModal;
window.closeNoteModal = closeNoteModal;
window.closeViewNoteModal = closeViewNoteModal;
window.handleFilePreview = handleFilePreview;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.copyToClipboard = copyToClipboard;

console.log('UI functions loaded');
