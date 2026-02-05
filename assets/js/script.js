let galleryData = [];

async function initGallery() {
    try {
        const response = await fetch('./assets/imgs/_imageNamesList.json');
        
        // Теперь 'data' — это СРАЗУ массив строк, который ты прислал выше
        const data = await response.json();

        galleryData = data; 
        
        startApp();
    } catch (e) {
        console.error("Ошибка! Проверь синтаксис JSON или пути:", e);
    }
}

function startApp() {
    const grid = $('#grid');
    // Оставляем оригинальный порядок, так как прижимаем к низу
    const items = [...galleryData]; 

    items.forEach(name => {
        const anchor = $(`
            <a href="./assets/imgs/${name}" class="gallery-item">
                <img src="./assets/imgs/${name}" alt="" />
            </a>
        `);
        grid.append(anchor);
    });

    grid.justifiedGallery({
        rowHeight: 300,
        margins: 5,
        lastRow: 'hide',
    }).on('jg.complete', function () {

        
        gsap.registerPlugin(ScrollTrigger);

        const images = gsap.utils.toArray("#grid a").reverse();
        let currentIndex = -1;
        let currentYOffset = 0;

        ScrollTrigger.observe({
            target: window,
            type: "wheel,touch,pointer",
            onUp: () => { 
                document.querySelector('.intro').classList.add('hidden');
                if (currentIndex >= images.length - 1) return;

                currentIndex++;
                const target = images[currentIndex];

                // 1. Появление картинки
                gsap.fromTo(target, 
                    { opacity: 0, y: -400, scale: 0.9 }, 
                    { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power2.out" }
                );

                // 2. Умный подъем сетки
                const gridEl = document.getElementById('grid');
                const viewportH = window.innerHeight;
                const rect = target.getBoundingClientRect();

                // Если верх картинки поднялся выше 20% экрана — подтягиваем сетку
                if (rect.top < viewportH * -0.4) {
                    const maxOffset = Math.max(0, gridEl.offsetHeight - viewportH);
                    currentYOffset = Math.min(currentYOffset + 350, maxOffset);
                    
                    gsap.to("#grid", {
                        y: +currentYOffset, 
                        duration: 0.8,
                        ease: "power2.out",
                        overwrite: "auto"
                    });
                }
            },
            onDown: () => {
                if (currentIndex < 0) return;

                const target = images[currentIndex];
                
                // 1. Исчезновение текущей картинки
                gsap.to(target, {
                    opacity: 0, 
                    y: -150, 
                    scale: 0.9, 
                    duration: 0.5,
                    ease: "power2.in"
                });

                currentIndex--;

                const viewportH = window.innerHeight;
                const rect = target.getBoundingClientRect();

                // Логика "умного" спуска:
                // Если при удалении картинки её низ находится в нижней части экрана (ниже 70%)
                // значит, нам нужно опустить сетку, чтобы не оставлять пустоту сверху
                if (rect.bottom > viewportH * 0.8) {
                    currentYOffset = Math.max(currentYOffset - 400, 0);

                    gsap.to("#grid", {
                        y: +currentYOffset,
                        duration: 0.8,
                        ease: "power2.out",
                        overwrite: true
                    });
                }
            }
        });
    });
}


initGallery();
