// Modal System for the Dating App

const ModalSystem = {
    init() {
        // Create modal container if it doesn't exist
        this.getContainer();
        
        // Close modal when clicking outside content
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.close(e.target.id);
            }
        });
        
        // Close modal when pressing escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal.show');
                if (openModals.length > 0) {
                    this.close(openModals[openModals.length - 1].id);
                }
            }
        });
    },
    
    getContainer() {
        let container = document.getElementById('modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modal-container';
            document.body.appendChild(container);
        }
        return container;
    },
    
    show(modalId, options = {}) {
        // Check if modal already exists
        let modal = document.getElementById(modalId);
        
        // If not, create it
        if (!modal) {
            modal = this.create(modalId, options);
        }
        
        // Show the modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        return modal;
    },
    
    create(modalId, options = {}) {
        const { title, content, size = 'medium', closable = true } = options;
        
        // Create modal element
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = `modal modal-${size}`;
        
        // Create modal content
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    ${title ? `<div class="modal-header">
                        <h4 class="modal-title">${title}</h4>
                        ${closable ? `<button type="button" class="modal-close" data-modal-close="${modalId}">
                            <i class="fas fa-times"></i>
                        </button>` : ''}
                    </div>` : ''}
                    <div class="modal-body">
                        ${content || ''}
                    </div>
                </div>
            </div>
        `;
        
        // Add to container
        const container = this.getContainer();
        container.appendChild(modal);
        
        // Add event listeners for close buttons
        const closeButtons = modal.querySelectorAll('[data-modal-close]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.close(button.getAttribute('data-modal-close'));
            });
        });
        
        return modal;
    },
    
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    },
    
    setContent(modalId, content) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.innerHTML = content;
            }
        }
    },
    
    setTitle(modalId, title) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = title;
            }
        }
    },
    
    showConfirmation(title, message, onConfirm, onCancel) {
        const modalId = 'confirmation-modal';
        
        // Create confirmation content
        const content = `
            <div class="confirmation-message">${message}</div>
            <div class="modal-actions">
                <button class="btn btn-outline" id="modal-cancel-btn">Cancel</button>
                <button class="btn btn-primary" id="modal-confirm-btn">Confirm</button>
            </div>
        `;
        
        // Show modal
        const modal = this.show(modalId, { title, content });
        
        // Add event listeners
        const confirmBtn = modal.querySelector('#modal-confirm-btn');
        const cancelBtn = modal.querySelector('#modal-cancel-btn');
        
        confirmBtn.addEventListener('click', () => {
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
            this.close(modalId);
        });
        
        cancelBtn.addEventListener('click', () => {
            if (typeof onCancel === 'function') {
                onCancel();
            }
            this.close(modalId);
        });
    },
    
    showAlert(title, message, onClose) {
        const modalId = 'alert-modal';
        
        // Create alert content
        const content = `
            <div class="alert-message">${message}</div>
            <div class="modal-actions">
                <button class="btn btn-primary" id="modal-ok-btn">OK</button>
            </div>
        `;
        
        // Show modal
        const modal = this.show(modalId, { title, content });
        
        // Add event listener
        const okBtn = modal.querySelector('#modal-ok-btn');
        
        okBtn.addEventListener('click', () => {
            if (typeof onClose === 'function') {
                onClose();
            }
            this.close(modalId);
        });
    }
};

// Initialize modal system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ModalSystem.init();
});