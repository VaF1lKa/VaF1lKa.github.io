let galleryData = [];

async function initGallery() {
    try {
        const response = await fetch('./assets/imgs/imageNamesList.json');
        
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
        // Используем тег img для подключения внешнего SVG
        const heartImg = document.createElement('img');//////////////////////////////////////////////////////////////////////
        const heartContainer = document.getElementById('heart-container');
        const vignette = document.getElementById('vignette');
        const decorHearts = document.getElementById('decoration-hearts');
        
        let currentIndex = -1;
        let currentYOffset = 0;
        let isHeartMode = false; // Состояние "упаковки" в сердечко

        ScrollTrigger.observe({
            target: window,
            type: "wheel,touch,pointer",
            tolerance: 60, 
            onUp: () => { 
                if (isHeartMode) return;

                document.querySelector('.intro').classList.add('hidden');
                if (currentIndex >= images.length - 1) {
                    isHeartMode = true;
                    packIntoHeart();
                    return;
                }

                currentIndex++;
                const target = images[currentIndex];

                // 1. Появление картинки
                gsap.fromTo(target, { 
                        opacity: 0, 
                        x: (i) => (Math.random() - 0.5) * 200,
                        rotation: () => (Math.random() - 0.5) * 45,
                        y: -400, 
                        scale: 0.9 
                    }, 
                    {
                        opacity: 1, 
                        x: 0,
                        y: 0, 
                        rotation: 0, 
                        scale: 1, 
                        duration: 0.3, 
                        ease: "power2.out" }
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
                // Если мы в режиме сердечка — сначала "распаковываем" его
                if (isHeartMode) {
                    unpackFromHeart();
                    return;
                }

                if (currentIndex < 0) return;

                const target = images[currentIndex];
                
                // 1. Исчезновение текущей картинки
                gsap.to(target, {
                    opacity: 0, 
                    x: (i) => (Math.random() - 0.5) * 200,
                    y: (i) => (Math.random() - 0.5) * 200 - (window.innerHeight / 2), 
                    rotation: () => (Math.random() - 0.5) * 45,
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

        // Функция упаковки в сердечко
        function packIntoHeart() {
            const tl = gsap.timeline();
            const visibleImages = images.filter(img => gsap.getProperty(img, "opacity") > 0);
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            // 1. Анимация схлопывания карточек точно в центр экрана
            tl.to(visibleImages, {
                x: (i, target) => {
                    const rect = target.getBoundingClientRect();
                    return centerX - (rect.left + rect.width / 2);
                },
                y: (i, target) => {
                    const rect = target.getBoundingClientRect();
                    return centerY - (rect.top + rect.height / 2);
                },
                scale: 0,
                rotation: () => (Math.random() - 0.5) * 90,
                duration: 0.8,
                stagger: {
                    amount: 0.4,
                    from: "center"
                },
                ease: "power3.in"
            });

            tl.to([vignette, decorHearts], { 
                opacity: 1, 
                duration: 1.5 
            }, "-=0.5"); // Виньетка плавно проявляется

            // 2. Появление сердечка
            tl.to(heartContainer, {
                scale: 1,
                opacity: 1,
                duration: 0.8,
                ease: "elastic.out(1, 0.5)"
            }, "-=0.2");

            // 3. Пульсация
            tl.to(heartContainer, {
                scale: 1.15,
                duration: 0.6,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }

        function unpackFromHeart() {
            isHeartMode = false;
            gsap.killTweensOf(heartContainer);
            
            const tl = gsap.timeline();

            tl.to(heartContainer, {
                scale: 0,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in"
            });

            tl.to([vignette, decorHearts], { 
                opacity: 0, 
                duration: 1.5 
            }, "-=0.5"); // Виньетка плавно ghjgflftn

            // Возвращаем карточки на места каскадом
            const visibleImages = images.slice(0, currentIndex + 1);
            tl.to(visibleImages, {
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                rotation: 0,
                duration: 0.7,
                stagger: {
                    amount: 0.3,
                    from: "end"
                },
                ease: "back.out(1.2)"
            }, "-=0.1");
        }
    });
}

initGallery();