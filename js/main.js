(function setupHeroAnimation() {
    let animationRunning = false;
    let initialStates = [];
    const ANIMATION_DURATION = 1800; 
    const PAUSE_DURATION = 1200;

    // Store original state
    function storeInitialStates() {
        const boxes = document.querySelectorAll('.grid-box[data-initial-index]');
        if (initialStates.length > 0) {
            boxes.forEach(box => {
                const idx = parseInt(box.dataset.initialIndex, 10);
                if (initialStates[idx]) {
                    initialStates[idx].rect = box.getBoundingClientRect();
                }
            });
            return;
        }
        boxes.forEach(box => {
            const idx = parseInt(box.dataset.initialIndex, 10);
            initialStates[idx] = {
                index: idx,
                rect: box.getBoundingClientRect(),
                innerHTML: box.innerHTML,
                className: box.className,
                swapGroup: box.dataset.swapGroup
            };
        });
    }

    // Shuffle helper
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Grid scale
    function getScale() {
        const grid = document.getElementById('boxGrid');
        if (!grid) return 1;
        const transform = window.getComputedStyle(grid).transform;
        if (transform === 'none') return 1;
        const match = transform.match(/matrix\((.+)\)/);
        if (match) {
            const values = match[1].split(', ');
            return parseFloat(values[0]);
        }
        return 1;
    }

    // Swap two boxes
    function physicalSwap(el1, el2, swapType) {
        return new Promise(resolve => {
            const scale = getScale();
            const r1 = el1.getBoundingClientRect();
            const r2 = el2.getBoundingClientRect();

            [el1, el2].forEach(el => el.classList.add('animating'));

            el1.style.transform = `translate(${(r2.left - r1.left) / scale}px, ${(r2.top - r1.top) / scale}px)`;
            el2.style.transform = `translate(${(r1.left - r2.left) / scale}px, ${(r1.top - r2.top) / scale}px)`;

            setTimeout(() => {
                [el1, el2].forEach(el => el.style.transition = 'none');

                if (swapType === 'text') {
                    [el1.innerHTML, el2.innerHTML] = [el2.innerHTML, el1.innerHTML];
                } else { 
                    const d1_idx = el1.dataset.initialIndex;
                    const d2_idx = el2.dataset.initialIndex;

                    [el1.innerHTML, el2.innerHTML] = [el2.innerHTML, el1.innerHTML];
                    [el1.className, el2.className] = [el2.className, el1.className];

                    el1.dataset.initialIndex = d1_idx;
                    el2.dataset.initialIndex = d2_idx;
                }

                [el1.style.transform, el2.style.transform] = ['', ''];
                requestAnimationFrame(() => {
                    [el1, el2].forEach(el => {
                        el.style.transition = '';
                        el.classList.remove('animating');
                    });
                    resolve();
                });
            }, ANIMATION_DURATION);
        });
    }

    // Swap three boxes (circular)
    function physicalSwapThree(el1, el2, el3, swapType) {
        return new Promise(resolve => {
            const scale = getScale();
            const r1 = el1.getBoundingClientRect();
            const r2 = el2.getBoundingClientRect();
            const r3 = el3.getBoundingClientRect();

            [el1, el2, el3].forEach(el => el.classList.add('animating'));

            el1.style.transform = `translate(${(r2.left - r1.left) / scale}px, ${(r2.top - r1.top) / scale}px)`;
            el2.style.transform = `translate(${(r3.left - r2.left) / scale}px, ${(r3.top - r2.top) / scale}px)`;
            el3.style.transform = `translate(${(r1.left - r3.left) / scale}px, ${(r1.top - r3.top) / scale}px)`;

            setTimeout(() => {
                [el1, el2, el3].forEach(el => el.style.transition = 'none');

                const props1 = { innerHTML: el1.innerHTML, className: el1.className, swapGroup: el1.dataset.swapGroup, idx: el1.dataset.initialIndex };
                const props2 = { innerHTML: el2.innerHTML, className: el2.className, swapGroup: el2.dataset.swapGroup, idx: el2.dataset.initialIndex };
                const props3 = { innerHTML: el3.innerHTML, className: el3.className, swapGroup: el3.dataset.swapGroup, idx: el3.dataset.initialIndex };

                if (swapType === 'text') {
                    el1.innerHTML = props3.innerHTML;
                    el2.innerHTML = props1.innerHTML;
                    el3.innerHTML = props2.innerHTML;
                } else {
                    [el1.innerHTML, el1.className, el1.dataset.swapGroup, el1.dataset.initialIndex] = [props3.innerHTML, props3.className, props3.swapGroup, props3.idx];
                    [el2.innerHTML, el2.className, el2.dataset.swapGroup, el2.dataset.initialIndex] = [props1.innerHTML, props1.className, props1.swapGroup, props1.idx];
                    [el3.innerHTML, el3.className, el3.dataset.swapGroup, el3.dataset.initialIndex] = [props2.innerHTML, props2.className, props2.swapGroup, props2.idx];
                }

                [el1, el2, el3].forEach(el => el.style.transform = '');
                requestAnimationFrame(() => {
                    [el1, el2, el3].forEach(el => {
                        el.style.transition = '';
                        el.classList.remove('animating');
                    });
                    resolve();
                });
            }, ANIMATION_DURATION);
        });
    }

    // Text swap
    async function performTextSwap() {
        const elements = shuffle(Array.from(document.querySelectorAll('[data-swap-group="text"]')));
        if (elements.length < 4) return;
        await Promise.all([
            physicalSwap(elements[0], elements[1], 'text'),
            physicalSwap(elements[2], elements[3], 'text')
        ]);
    }

    // Card swap
    async function performCardSwapStep(numToSwap) {
        const elements = shuffle(Array.from(document.querySelectorAll('[data-swap-group="card"]')));
        if (elements.length < numToSwap) return;
        if (numToSwap === 3) await physicalSwapThree(elements[0], elements[1], elements[2], 'card');
        else if (numToSwap === 2) await physicalSwap(elements[0], elements[1], 'card');
    }

    // Reset animation
    async function performResetAnimation() {
        const currentBoxes = Array.from(document.querySelectorAll('.grid-box[data-initial-index]'));
        const animationPromises = [];
        const scale = getScale();

        currentBoxes.forEach(box => {
            const idx = parseInt(box.dataset.initialIndex, 10);
            const home = initialStates[idx];
            if (!home) return;

            const rect = box.getBoundingClientRect();
            const dx = (home.rect.left - rect.left) / scale;
            const dy = (home.rect.top - rect.top) / scale;

            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                animationPromises.push(new Promise(resolve => {
                    box.classList.add('animating');
                    box.style.transform = `translate(${dx}px, ${dy}px)`;
                    setTimeout(resolve, ANIMATION_DURATION);
                }));
            }
        });

        await Promise.all(animationPromises);

        currentBoxes.forEach(box => {
            const idx = parseInt(box.dataset.initialIndex, 10);
            const home = initialStates[idx];
            if (!home) return;

            box.innerHTML = home.innerHTML;
            box.className = home.className;
            box.dataset.swapGroup = home.swapGroup;

            box.style.transition = 'none';
            box.style.transform = '';
            requestAnimationFrame(() => {
                box.style.transition = '';
                box.classList.remove('animating');
            });
        });
    }

    // Main loop
    async function runAnimationCycle() {
        if (!animationRunning) return;

        await performTextSwap(); if (!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));

        await performCardSwapStep(3); if (!animationRunning) return;
        await performCardSwapStep(2); if (!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));

        await performCardSwapStep(3); if (!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));

        await performCardSwapStep(2); if (!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));

        await performResetAnimation(); if (!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));

        if (animationRunning) runAnimationCycle();
    }

    function manageHeroAnimation() {
        if (!animationRunning) {
            setTimeout(() => {
                storeInitialStates();
                animationRunning = true;
                runAnimationCycle();
            }, 100);
        }
    }

    window.addEventListener('load', manageHeroAnimation);
    window.addEventListener('resize', () => {
        storeInitialStates();
        manageHeroAnimation();
    });
})();



// Services Section Logic FOR DESKTOP VIEW
const contentData = {
  software: `<h2>Software Product Engineering</h2><p>We excel in software product engineering, leveraging our software experts to deliver seamless integration, innovative design, and optimized performance, helping businesses thrive in the ever-evolving digital landscape.</p><div class="services"><div>API & Microservices</div><div>Enterprise CMS Solutions</div><div>Software Modernization</div><div>Cloud Application Development</div><div>Enterprise Software Development</div><div>Software Outsourcing</div><div>Custom CRM Software</div><div>Microsoft Development</div><div>Software Support and Maintenance</div><div>Custom Software Development</div><div>Mobile App Development</div><div>Testing and Quality Assurance</div><div>DevOps Consulting Services</div><div>Software Consulting</div></div>`,
  website: `<h2>Website & E-Commerce</h2><p>We build responsive, scalable, and secure websites & e-commerce platforms that drive engagement and revenue growth.</p><div class="services"><div>AbleCommerce Website Developement</div><div>Bagisto E-Commerce</div><div>E-Commerce Webiste Design</div><div>Shopify Website Development</div><div>Web Development</div><div>Front-end Developement</div><div>Resonsive Websites</div><div> Websites Maintenance Services</div><div>Website Redesign Services</div><div>WordPress Website Developement</div></div>`,
  digital: `<h2>Digital Experience</h2><p>Delivering personalized digital experiences...</p><div class="services"><div>UI/UX Design</div><div>Customer Journey Mapping</div><div>Omnichannel Experience</div></div>`,
  remote: `<h2>Remote Team</h2><p>Build and manage skilled remote teams...</p><div class="services"><div>Dedicated Developers</div><div>Project Managers</div><div>QA & Testing Experts</div></div>`,
  hitech: `<h2>Hi-Tech</h2><p>We provide advanced technology solutions...</p><div class="services"><div>AI & Machine Learning</div><div>Blockchain Solutions</div><div>IoT Development</div></div>`,
  marketing: `<h2>Online Marketing</h2><p>Boost your online presence...</p><div class="services"><div>SEO Optimization</div><div>Social Media Marketing</div><div>Email Campaigns</div><div>Content Strategy</div></div>`
};
function showContent(type, event) {
  const contentBox = document.getElementById("content-box");
  if (contentBox) {
    contentBox.innerHTML = contentData[type];
  }
  document.querySelectorAll(".sidebar button").forEach(btn => btn.classList.remove("active"));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add("active");
  }
}

// --- NEW SERVICES ACCORDION LOGIC FOR MOBILE VIEW ---
(function() {
    function setupAccordion() {
        const accordionHeaders = document.querySelectorAll('.accordion-service-header');

        accordionHeaders.forEach(clickedHeader => {
            clickedHeader.addEventListener('click', function() {
                const content = this.nextElementSibling;
                const isAlreadyOpen = this.classList.contains('active');

                // First, close all accordion items
                document.querySelectorAll('.accordion-service-item').forEach(item => {
                    item.querySelector('.accordion-service-header').classList.remove('active');
                    item.querySelector('.accordion-service-content').classList.remove('open');
                });

                // If the clicked item was not already open, then open it.
                if (!isAlreadyOpen) {
                    this.classList.add('active');
                    content.classList.add('open');
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAccordion);
    } else {
        setupAccordion();
    }
})();


// ------------------- SCRIPT FROM Tools.html -------------------
const expertiseButtons = document.querySelectorAll(".expertise-filters button");
const logos = document.querySelectorAll(".logos img");
function showCategory(category) {
  logos.forEach(img => {
    img.classList.remove("show");
    if (img.dataset.category === category) img.classList.add("show");
  });
}
expertiseButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    expertiseButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    showCategory(btn.dataset.category);
  });
});
if (expertiseButtons.length) showCategory("backend");

// ------------------- SCRIPT FROM Connector.html -------------------
(function(){
  const flowMiddle = document.getElementById('flowMiddle');
  if (!flowMiddle) return;
  function positionConnectors(){
    if (window.innerWidth <= 768) return; // Don't run on mobile
    const segs = Array.from(flowMiddle.querySelectorAll('.seg'));
    if (!segs.length) return;
    const containerRect = flowMiddle.getBoundingClientRect();
    const seams = [];
    for (let i=0; i<segs.length-1; i++){
      const leftRect = segs[i].getBoundingClientRect();
      seams.push(leftRect.right - containerRect.left);
    }
    const connectors = Array.from(flowMiddle.querySelectorAll('.connector'));
    connectors.forEach(conn => {
      const seamIndex = parseInt(conn.dataset.seam, 10);
      if (!isNaN(seamIndex) && seamIndex >= 1 && seamIndex <= seams.length){
        conn.style.left = seams[seamIndex - 1] + 'px';
      }
    });
  }
  window.addEventListener('load', positionConnectors);
  window.addEventListener('resize', () => { clearTimeout(window._posT); window._posT = setTimeout(positionConnectors, 80); });
})();

// Accordion Logic
const headers = document.querySelectorAll('.accordion-header');
headers.forEach(header => {
  header.addEventListener('click', () => {
    const content = header.nextElementSibling;
    header.classList.toggle('active');
    content.classList.toggle('open');
  });
});

// Start hero animation only on desktop
// function manageHeroAnimation() {
//     if (window.innerWidth ) {
//         if (!swapInterval) { // if not already running
//             swapContent();
//         }
//     } else {
//         if (swapInterval) { // if running
//             clearInterval(swapInterval);
//             swapInterval = null;
//         }
//     }
// }



// window.addEventListener('load', manageHeroAnimation);
// window.addEventListener('resize', manageHeroAnimation);



 document.getElementById('showMoreBtn').addEventListener('click', function() {
    const grid = document.querySelector('.standout-grid');
    grid.classList.toggle('show-all');

    // Change button text
    if (grid.classList.contains('show-all')) {
        this.textContent = 'Show less';
    } else {
        this.textContent = 'Show more';
    }
});
