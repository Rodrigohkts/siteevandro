document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    //  NAVBAR SCROLL EFFECT
    // =============================================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // =============================================
    //  MOBILE MENU TOGGLE
    // =============================================
    const mobileBtn = document.getElementById('mobile-btn');
    const navbarMobile = document.getElementById('navbar');

    if (mobileBtn && navbarMobile) {
        mobileBtn.addEventListener('click', () => {
            navbarMobile.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (navbarMobile.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        document.querySelectorAll('.navbar a').forEach(link => {
            link.addEventListener('click', () => {
                navbarMobile.classList.remove('active');
                const icon = mobileBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // =============================================
    //  SCROLL ANIMATIONS (IntersectionObserver)
    // =============================================
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.fade-up, .reveal-up, .reveal-left, .reveal-right');
    animateElements.forEach(el => observer.observe(el));

    // Active navbar section highlight
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
            const sectionId = current.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href*=${sectionId}]`);
            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            }
        });
    });


    // =============================================
    //  SECRET CMS EDIT MODE — TRIGGER: 41417
    // =============================================
    let keyBuffer = '';
    const SECRET_CODE = '41417';

    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing inside an editable element (so existing text editing still works)
        if (document.body.classList.contains('edit-mode') && e.target.hasAttribute('contenteditable')) return;

        keyBuffer += e.key;
        if (keyBuffer.length > SECRET_CODE.length) {
            keyBuffer = keyBuffer.slice(-SECRET_CODE.length);
        }
        if (keyBuffer === SECRET_CODE) {
            keyBuffer = '';
            toggleEditMode();
        }
    });

    // =============================================
    //  CMS CORE FUNCTIONS
    // =============================================

    let editModeActive = false;
    let fileInputProxy = null;
    let currentImageTarget = null;

    function toggleEditMode() {
        editModeActive = !editModeActive;
        if (editModeActive) {
            enableEditMode();
        } else {
            disableEditMode();
        }
    }

    function enableEditMode() {
        document.body.classList.add('edit-mode');
        document.getElementById('admin-bar').classList.add('visible');

        // Mark all editable text elements
        const textSelectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'a', 'span', 'li'
        ];

        textSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                // Skip elements inside the admin bar itself
                if (el.closest('#admin-bar')) return;
                // Skip elements that are purely icon containers
                if (el.children.length === 1 && el.children[0].tagName === 'I') return;

                el.setAttribute('contenteditable', 'true');
                el.setAttribute('data-editable', 'true');
                el.setAttribute('data-original', el.innerHTML);
            });
        });

        // Mark all images as replaceable
        document.querySelectorAll('img').forEach(img => {
            if (img.closest('#admin-bar')) return;
            // Wrap image in a div for positioning ::after pseudo-element
            if (!img.parentElement.hasAttribute('data-editable-img')) {
                const wrapper = document.createElement('div');
                wrapper.setAttribute('data-editable-img', 'true');
                wrapper.style.position = 'relative';
                wrapper.style.display = 'inline-block';
                wrapper.style.width = img.style.width || '100%';
                wrapper.style.height = img.style.height || 'auto';
                img.parentNode.insertBefore(wrapper, img);
                wrapper.appendChild(img);
            }
            img.closest('[data-editable-img]').addEventListener('click', handleImageClick);
        });

        // Create a hidden file input that we reuse
        fileInputProxy = document.createElement('input');
        fileInputProxy.type = 'file';
        fileInputProxy.accept = 'image/*';
        fileInputProxy.style.display = 'none';
        document.body.appendChild(fileInputProxy);
        fileInputProxy.addEventListener('change', handleFileChosen);

        showToast('✏️ Modo Editor Ativado! Clique em textos ou imagens para editar.');
    }

    function disableEditMode() {
        document.body.classList.remove('edit-mode');
        document.getElementById('admin-bar').classList.remove('visible');

        // Remove contenteditable from all elements
        document.querySelectorAll('[data-editable]').forEach(el => {
            el.removeAttribute('contenteditable');
            el.removeAttribute('data-editable');
            el.removeAttribute('data-original');
        });

        // Remove image wrappers (unwrap images)
        document.querySelectorAll('[data-editable-img]').forEach(wrapper => {
            const img = wrapper.querySelector('img');
            if (img) {
                wrapper.parentNode.insertBefore(img, wrapper);
                wrapper.parentNode.removeChild(wrapper);
            }
        });

        // Remove image click listeners (fresh on re-enable)
        if (fileInputProxy) {
            document.body.removeChild(fileInputProxy);
            fileInputProxy = null;
        }

        showToast('🔒 Modo Editor Desativado.');
    }

    // =============================================
    //  IMAGE HANDLING
    // =============================================

    function handleImageClick(e) {
        if (!editModeActive) return;
        e.stopPropagation();
        currentImageTarget = this.querySelector('img');
        fileInputProxy.value = '';
        fileInputProxy.click();
    }

    function handleFileChosen(e) {
        const file = e.target.files[0];
        if (!file || !currentImageTarget) return;

        const reader = new FileReader();
        reader.onload = function(ev) {
            compressImage(ev.target.result, 1200, 0.85, function(compressedDataUrl) {
                currentImageTarget.src = compressedDataUrl;
                currentImageTarget.removeAttribute('srcset');
                showToast('🖼️ Imagem substituída!');
            });
        };
        reader.readAsDataURL(file);
    }

    function compressImage(dataUrl, maxWidth, quality, callback) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round(height * (maxWidth / width));
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = dataUrl;
    }

    // =============================================
    //  EXPORT / SAVE HTML
    // =============================================

    function exportHTML() {
        showToast('⏳ Gerando arquivo...');

        // Clone the page
        const clone = document.documentElement.cloneNode(true);

        // Remove admin bar from clone
        const adminBar = clone.querySelector('#admin-bar');
        if (adminBar) adminBar.remove();
        const toast = clone.querySelector('#cms-toast');
        if (toast) toast.remove();
        const fileInput = clone.querySelector('input[type="file"]');
        if (fileInput) fileInput.remove();

        // Remove edit-mode from body in clone
        clone.querySelector('body').classList.remove('edit-mode');

        // Clean up data attributes and contenteditable
        clone.querySelectorAll('[contenteditable]').forEach(el => {
            el.removeAttribute('contenteditable');
        });
        clone.querySelectorAll('[data-editable]').forEach(el => {
            el.removeAttribute('data-editable');
            el.removeAttribute('data-original');
        });

        // Unwrap image wrappers in clone
        clone.querySelectorAll('[data-editable-img]').forEach(wrapper => {
            const img = wrapper.querySelector('img');
            if (img) {
                wrapper.parentNode.insertBefore(img, wrapper);
                wrapper.parentNode.removeChild(wrapper);
            }
        });

        const htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        a.click();
        URL.revokeObjectURL(url);

        showToast('✅ index.html baixado! Suba no GitHub para publicar.');
    }

    // =============================================
    //  GLOBAL CMS EXPORTS (called from HTML buttons)
    // =============================================

    window.cmsExportHTML = exportHTML;

    window.cmsExitEditMode = function() {
        editModeActive = true;
        toggleEditMode();
    };

    // =============================================
    //  IMAGE PICKER MODAL
    // =============================================

    let pickerCompressedDataUrl = null;

    window.cmsOpenImagePicker = function() {
        if (!editModeActive) {
            showToast('Ative o Modo Editor primeiro (digite 41417).');
            return;
        }
        // Reset state
        pickerCompressedDataUrl = null;
        document.getElementById('picker-file-input').value = '';
        document.getElementById('picker-preview-img').src = '';
        document.getElementById('picker-preview-name').textContent = '';
        document.getElementById('picker-preview-wrap').classList.remove('visible');
        document.getElementById('picker-step-upload').style.display = 'flex';
        document.getElementById('picker-step-choose').classList.remove('visible');
        document.getElementById('img-picker-overlay').classList.add('visible');
    };

    window.cmsCloseImagePicker = function() {
        document.getElementById('img-picker-overlay').classList.remove('visible');
    };

    // Click outside modal to close
    document.getElementById('img-picker-overlay').addEventListener('click', function(e) {
        if (e.target === this) window.cmsCloseImagePicker();
    });

    // Drag & Drop support
    const dropzone = document.getElementById('picker-dropzone');
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.background = 'rgba(48,209,88,0.1)'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.background = ''; });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.background = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handlePickerFile(file);
        }
    });

    document.getElementById('picker-file-input').addEventListener('change', function() {
        if (this.files[0]) handlePickerFile(this.files[0]);
    });

    function handlePickerFile(file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            compressImage(ev.target.result, 1200, 0.85, function(compressed) {
                pickerCompressedDataUrl = compressed;
                document.getElementById('picker-preview-img').src = compressed;
                document.getElementById('picker-preview-name').textContent = file.name;
                document.getElementById('picker-preview-wrap').classList.add('visible');
                showToast('✅ Imagem carregada! Clique em "Próximo" para escolher o local.');
            });
        };
        reader.readAsDataURL(file);
    }

    window.cmsPickerGoToChoose = function() {
        if (!pickerCompressedDataUrl) {
            showToast('Selecione uma imagem primeiro.');
            return;
        }

        // Gather all site images (excluding admin bar, picker, toast)
        const allImgs = Array.from(document.querySelectorAll('img')).filter(img => {
            return !img.closest('#admin-bar') &&
                   !img.closest('#img-picker-overlay') &&
                   !img.closest('#cms-toast') &&
                   img.id !== 'picker-preview-img';
        });

        const grid = document.getElementById('picker-slots-grid');
        grid.innerHTML = '';

        allImgs.forEach((img, idx) => {
            const slot = document.createElement('div');
            slot.className = 'picker-slot';

            const thumb = document.createElement('img');
            thumb.src = img.src;
            thumb.alt = img.alt || `Imagem ${idx + 1}`;

            const label = document.createElement('div');
            label.className = 'picker-slot-label';
            label.textContent = img.alt || img.src.split('/').pop().substring(0, 30) || `Imagem ${idx + 1}`;

            slot.appendChild(thumb);
            slot.appendChild(label);

            slot.addEventListener('click', () => {
                img.src = pickerCompressedDataUrl;
                img.removeAttribute('srcset');
                window.cmsCloseImagePicker();
                showToast('🖼️ Imagem substituída com sucesso!');
            });

            grid.appendChild(slot);
        });

        document.getElementById('picker-step-upload').style.display = 'none';
        document.getElementById('picker-step-choose').classList.add('visible');
    };

    window.cmsPickerGoBack = function() {
        document.getElementById('picker-step-choose').classList.remove('visible');
        document.getElementById('picker-step-upload').style.display = 'flex';
    };

    // =============================================
    //  TOAST NOTIFICATION
    // =============================================

    let toastTimer = null;
    function showToast(message) {
        const toast = document.getElementById('cms-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.style.display = 'block';
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3500);
    }
});
