document.addEventListener('DOMContentLoaded', () => {
    // Aba / Menu navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    const forms = document.querySelectorAll('.tool-form');
    const previews = document.querySelectorAll('.tool-preview');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const target = btn.getAttribute('data-target');

            forms.forEach(f => {
                f.classList.remove('active');
                if(f.id === `form-${target}`) f.classList.add('active');
            });

            previews.forEach(p => {
                p.classList.remove('active');
                if(p.id === `preview-${target}`) p.classList.add('active');
            });
        });
    });
});

