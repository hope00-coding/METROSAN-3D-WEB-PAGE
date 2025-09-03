document.addEventListener('DOMContentLoaded', function () {
    const modelViewer = document.getElementById('ms3d-main-model');
    const sections = document.querySelectorAll('.ms3d-text-panel');
    const container = document.querySelector('.ms3d-container');

    console.log('🚀 Script başlatılıyor...');
    console.log('Model viewer bulundu:', !!modelViewer);
    console.log('Bölüm sayısı:', sections.length);
    console.log('Container bulundu:', !!container);

    // Model dosyalarınızı buraya ekleyin
    const modelSources = [
        '/models/model1 (2).glb',        // 1. bölüm
        '/models/model2.glb',        // 2. bölüm 
        '/models/model3.glb',        // 3. bölüm
        '/models/model4.glb',        // 4. bölüm
        '/models/model5.glb'         // 5. bölüm
    ];

    // Farklı kamera açıları (her bölüm için farklı görünüm)
    const cameraAngles = [
        '45deg 75deg 105%',      // Sağ önden
        '-45deg 75deg 105%',     // Sol önden  
        '0deg 90deg 120%',       // Üstten
        '180deg 75deg 105%',     // Arkadan
        '0deg 45deg 90%'         // Yakından önden
    ];

    if (!modelViewer || !container || sections.length === 0) {
        console.error('❌ Gerekli elementler bulunamadı!');
        return;
    }

    let currentIndex = -1;
    let isChanging = false;
    let ticking = false;

    // Smooth model değişimi
    const updateModel = (newIndex) => {
        if (newIndex === currentIndex || isChanging || newIndex < 0 || newIndex >= modelSources.length) {
            return;
        }

        console.log(`🔄 Bölüm ${newIndex + 1} aktif - Model güncelleniyor...`);

        isChanging = true;
        currentIndex = newIndex;

        // Mevcut aktif section'ı kaldır
        sections.forEach(section => section.classList.remove('active-section'));

        // Yeni aktif section'ı ekle
        sections[newIndex].classList.add('active-section');

        // Model transition
        modelViewer.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        modelViewer.style.opacity = '0.2';
        modelViewer.style.transform = 'scale(0.9) rotateY(15deg)';

        setTimeout(() => {
            // Model kaynaklarını güncelle
            const newModel = modelSources[newIndex];
            const newAngle = cameraAngles[newIndex];

            if (modelViewer.src !== newModel) {
                modelViewer.src = newModel;
            }
            modelViewer.cameraOrbit = newAngle;

            console.log(`✅ Model güncellendi: ${newModel}`);
            console.log(`📷 Kamera açısı: ${newAngle}`);

            // Fade in back
            setTimeout(() => {
                modelViewer.style.opacity = '1';
                modelViewer.style.transform = 'scale(1) rotateY(0deg)';

                setTimeout(() => {
                    isChanging = false;
                }, 300);
            }, 150);

        }, 300);
    };

    // Geliştirilmiş scroll pozisyon hesabı
    const getActiveSection = () => {
        const containerRect = container.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerHeight = containerRect.height;

        // Container viewport'ta mı kontrol et
        if (containerTop > window.innerHeight || containerTop + containerHeight < 0) {
            return -1;
        }

        // Container içindeki scroll pozisyonunu hesapla
        const scrollProgress = Math.max(0, Math.min(1, -containerTop / (containerHeight - window.innerHeight)));

        // Bölüm sayısına göre index hesapla
        const sectionIndex = Math.floor(scrollProgress * sections.length);

        // Sınırları kontrol et
        return Math.max(0, Math.min(sections.length - 1, sectionIndex));
    };

    // Alternatif hesaplama yöntemi
    const getActiveSectionByPosition = () => {
        const viewportCenter = window.innerHeight / 2;
        let activeIndex = -1;
        let minDistance = Infinity;

        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            const sectionCenter = rect.top + (rect.height / 2);
            const distance = Math.abs(sectionCenter - viewportCenter);

            // Section viewport'ta görünür mü?
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

            if (isVisible && distance < minDistance) {
                minDistance = distance;
                activeIndex = index;
            }
        });

        return activeIndex;
    };

    // Ana scroll handler
    const handleScroll = () => {
        if (ticking) return;

        ticking = true;

        requestAnimationFrame(() => {
            // İki farklı yöntemle aktif bölümü bul
            const method1 = getActiveSection();
            const method2 = getActiveSectionByPosition();

            // Daha güvenilir olanı seç
            let activeIndex = method2 !== -1 ? method2 : method1;

            if (activeIndex >= 0 && activeIndex !== currentIndex) {
                console.log(`📜 Scroll - Aktif bölüm değişti: ${activeIndex + 1}`);
                updateModel(activeIndex);
            }

            ticking = false;
        });
    };

    // Optimized scroll listener
    let scrollTimer = null;
    const scrollHandler = () => {
        if (scrollTimer !== null) {
            clearTimeout(scrollTimer);
        }

        scrollTimer = setTimeout(() => {
            handleScroll();
        }, 16); // ~60fps
    };

    // Event listeners
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('resize', scrollHandler, { passive: true });

    // Model viewer events
    modelViewer.addEventListener('load', () => {
        console.log('✅ Model yüklendi');
        modelViewer.classList.add('ms3d-fade-effect');
    });

    modelViewer.addEventListener('error', (e) => {
        console.error('❌ Model yükleme hatası:', e);
    });

    // Intersection Observer ile performans iyileştirmesi
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -20% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        let mostVisibleEntry = null;
        let maxRatio = 0;

        entries.forEach(entry => {
            if (entry.intersectionRatio > maxRatio) {
                maxRatio = entry.intersectionRatio;
                mostVisibleEntry = entry;
            }
        });

        if (mostVisibleEntry && maxRatio > 0.3) {
            const index = Array.from(sections).indexOf(mostVisibleEntry.target);
            if (index !== -1 && index !== currentIndex) {
                console.log(`👁️ Observer - Aktif bölüm: ${index + 1}`);
                updateModel(index);
            }
        }
    }, observerOptions);

    // Tüm section'ları observe et
    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // İlk yükleme kontrolü
    const initializeFirstSection = () => {
        setTimeout(() => {
            console.log('🎬 İlk kontrol yapılıyor...');

            const activeIndex = getActiveSectionByPosition();

            if (activeIndex >= 0) {
                console.log(`🎯 İlk aktif bölüm: ${activeIndex + 1}`);
                updateModel(activeIndex);
            } else {
                // Default olarak ilk bölümü aktif yap
                console.log('🎯 Default: İlk bölüm aktif');
                updateModel(0);
            }
        }, 500);
    };

    // Sayfa tamamen yüklendiğinde initialize et
    if (document.readyState === 'complete') {
        initializeFirstSection();
    } else {
        window.addEventListener('load', initializeFirstSection);
    }

    // Debug fonksiyonları
    window.debugScrollModel = {
        getCurrentIndex: () => currentIndex,
        testSection: (index) => {
            console.log(`🧪 Manuel test: Bölüm ${index + 1}`);
            updateModel(index);
        },
        getScrollProgress: () => {
            const containerRect = container.getBoundingClientRect();
            const scrollProgress = Math.max(0, Math.min(1, -containerRect.top / (containerRect.height - window.innerHeight)));
            console.log('Scroll Progress:', (scrollProgress * 100).toFixed(1) + '%');
            return scrollProgress;
        },
        showSectionPositions: () => {
            console.log('=== BÖLÜM POZİSYONLARI ===');
            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                console.log(`Bölüm ${index + 1}:`, {
                    top: rect.top.toFixed(0),
                    bottom: rect.bottom.toFixed(0),
                    height: rect.height.toFixed(0),
                    visible: rect.top < window.innerHeight && rect.bottom > 0,
                    center: (rect.top + rect.height / 2).toFixed(0)
                });
            });
        }
    };

    console.log('💡 Debug komutları:');
    console.log('- window.debugScrollModel.testSection(0-4)');
    console.log('- window.debugScrollModel.getScrollProgress()');
    console.log('- window.debugScrollModel.showSectionPositions()');

});