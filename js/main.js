(function setupHeroAnimation() {
        let animationRunning = false;
        let initialStates = [];
        // Animation timings
        const ANIMATION_DURATION = 1800; // Duration for the slide animation
        const PAUSE_DURATION = 1200;   // Pause between animation steps (1.2 seconds)

        // Stores the original position, content, and classes of each grid box
        function storeInitialStates() {
            const boxes = document.querySelectorAll('.grid-box[data-initial-index]');
            if (initialStates.length > 0) { // If already stored, just update positions on resize
                boxes.forEach(box => {
                    const initialIndex = parseInt(box.dataset.initialIndex, 10);
                    if (initialStates[initialIndex]) {
                       initialStates[initialIndex].rect = box.getBoundingClientRect();
                    }
                });
                return;
            }
            // First time storing
            boxes.forEach(box => {
                const initialIndex = parseInt(box.dataset.initialIndex, 10);
                initialStates[initialIndex] = {
                    index: initialIndex,
                    rect: box.getBoundingClientRect(),
                    innerHTML: box.innerHTML,
                    className: box.className,
                };
            });
        }

        // Helper function to shuffle an array for randomizing swaps
        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
        
        // Gets the CSS scale factor of the grid container (for mobile view)
        function getScale() {
            const grid = document.getElementById('boxGrid');
            if (!grid) return 1;
            const transform = window.getComputedStyle(grid).transform;
            if (transform === 'none') return 1;
            const matrix = transform.match(/matrix\((.+)\)/);
            if (matrix) {
                const values = matrix[1].split(', ');
                return parseFloat(values[0]); // scaleX
            }
            return 1;
        }

        // Swaps two elements visually and then updates their content/classes
        function physicalSwap(el1, el2, swapType) {
            return new Promise(resolve => {
                const scale = getScale();
                const rect1 = el1.getBoundingClientRect();
                const rect2 = el2.getBoundingClientRect();
                
                [el1, el2].forEach(el => el.classList.add('animating'));

                // Apply transform to move elements to each other's positions
                el1.style.transform = `translate(${(rect2.left - rect1.left) / scale}px, ${(rect2.top - rect1.top) / scale}px)`;
                el2.style.transform = `translate(${(rect1.left - rect2.left) / scale}px, ${(rect1.top - rect2.top) / scale}px)`;

                // After animation, swap the actual content
                setTimeout(() => {
                    [el1, el2].forEach(el => el.style.transition = 'none');
                    if (swapType === 'text') {
                        [el1.innerHTML, el2.innerHTML] = [el2.innerHTML, el1.innerHTML];
                    } else { // 'card' swap
                        const d1_type = el1.dataset.swapType;
                        const d1_index = el1.dataset.initialIndex;
                        const d2_type = el2.dataset.swapType;
                        const d2_index = el2.dataset.initialIndex;

                        [el1.innerHTML, el2.innerHTML] = [el2.innerHTML, el1.innerHTML];
                        [el1.className, el2.className] = [el2.className, el1.className];

                        el1.dataset.swapType = d1_type;
                        el1.dataset.initialIndex = d1_index;
                        el2.dataset.swapType = d2_type;
                        el2.dataset.initialIndex = d2_index;
                    }
                    // Reset styles and remove animation class
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
        
        // Performs a circular swap of three elements
        function physicalSwapThree(el1, el2, el3, swapType) {
            return new Promise(resolve => {
                const scale = getScale();
                const rect1 = el1.getBoundingClientRect();
                const rect2 = el2.getBoundingClientRect();
                const rect3 = el3.getBoundingClientRect();

                [el1, el2, el3].forEach(el => el.classList.add('animating'));
                
                // Move 1->2, 2->3, 3->1
                el1.style.transform = `translate(${(rect2.left - rect1.left) / scale}px, ${(rect2.top - rect1.top) / scale}px)`;
                el2.style.transform = `translate(${(rect3.left - rect2.left) / scale}px, ${(rect3.top - rect2.top) / scale}px)`;
                el3.style.transform = `translate(${(rect1.left - rect3.left) / scale}px, ${(rect1.top - rect3.top) / scale}px)`;

                setTimeout(() => {
                    [el1, el2, el3].forEach(el => el.style.transition = 'none');
                    const props1 = { innerHTML: el1.innerHTML, className: el1.className, 'data-swap-type': el1.dataset.swapType, 'data-initial-index': el1.dataset.initialIndex };
                    const props2 = { innerHTML: el2.innerHTML, className: el2.className, 'data-swap-type': el2.dataset.swapType, 'data-initial-index': el2.dataset.initialIndex };
                    const props3 = { innerHTML: el3.innerHTML, className: el3.className, 'data-swap-type': el3.dataset.swapType, 'data-initial-index': el3.dataset.initialIndex };
                    
                    if (swapType === 'text') {
                        el1.innerHTML = props3.innerHTML;
                        el2.innerHTML = props1.innerHTML;
                        el3.innerHTML = props2.innerHTML;
                    } else { // 'card' swap
                        el1.innerHTML = props3.innerHTML;
                        el1.className = props3.className;
                        el1.dataset.swapType = props3['data-swap-type'];
                        el1.dataset.initialIndex = props3['data-initial-index'];

                        el2.innerHTML = props1.innerHTML;
                        el2.className = props1.className;
                        el2.dataset.swapType = props1['data-swap-type'];
                        el2.dataset.initialIndex = props1['data-initial-index'];

                        el3.innerHTML = props2.innerHTML;
                        el3.className = props2.className;
                        el3.dataset.swapType = props2['data-swap-type'];
                        el3.dataset.initialIndex = props2['data-initial-index'];
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

        // Performs the text-only swap on designated elements
        async function performTextSwap() {
            const elements = shuffle(Array.from(document.querySelectorAll('[data-swap-type="text"]')));
            if (elements.length < 4) return;
            // Swap two pairs simultaneously
            await Promise.all([
                physicalSwap(elements[0], elements[1], 'text'),
                physicalSwap(elements[2], elements[3], 'text')
            ]);
        }

        // Performs a swap of a specified number of cards
        async function performCardSwapStep(numToSwap) {
            const elements = shuffle(Array.from(document.querySelectorAll('[data-swap-type="card"]')));
            if (elements.length < numToSwap) return;
            if (numToSwap === 3) await physicalSwapThree(elements[0], elements[1], elements[2], 'card');
            else if (numToSwap === 2) await physicalSwap(elements[0], elements[1], 'card');
        }
        
        // Animates all boxes back to their original positions and restores content
        async function performResetAnimation() {
            const currentBoxes = Array.from(document.querySelectorAll('.grid-box'));
            const animationPromises = [];
            const scale = getScale();

            const homeElements = new Array(initialStates.length);
            currentBoxes.forEach(box => {
                const initialIndex = parseInt(box.dataset.initialIndex, 10);
                if (initialIndex >= 0) homeElements[initialIndex] = box;
            });

            homeElements.forEach((box, targetIndex) => {
                if (!box || !initialStates[targetIndex]) return;
                const homeState = initialStates[targetIndex];
                const currentRect = box.getBoundingClientRect();
                
                const deltaX = (homeState.rect.left - currentRect.left) / scale;
                const deltaY = (homeState.rect.top - currentRect.top) / scale;

                if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                    animationPromises.push(new Promise(resolve => {
                        box.classList.add('animating');
                        box.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                        setTimeout(resolve, ANIMATION_DURATION);
                    }));
                }
            });

            await Promise.all(animationPromises);
            
        homeElements.forEach((box, targetIndex) => {
          if (!box || !initialStates[targetIndex]) return;
          const homeState = initialStates[targetIndex];
        
          // Instead of replacing DOM after transform reset, do it before animation
          box.innerHTML = homeState.innerHTML;
          box.className = homeState.className;
        
          box.style.transition = 'none';
          box.style.transform = '';
          requestAnimationFrame(() => {
            box.style.transition = '';
            box.classList.remove('animating');
          });
        });
    }
        
    // Main loop that controls the sequence of animations
    async function runAnimationCycle() {
        if (!animationRunning) return;
        // 1. Text Swap First
        await performTextSwap(); if (!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));

        // 2. Varied Card Swaps
        await performCardSwapStep(3); if (!animationRunning) return;
        await performCardSwapStep(2); if (!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));

        await performCardSwapStep(3); if (!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));

        await performCardSwapStep(2); if (!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));

        // 3. Reset to original state
        await performResetAnimation(); if(!animationRunning) return;
        await new Promise(res => setTimeout(res, PAUSE_DURATION));
        
        // 4. Repeat
        if (animationRunning) runAnimationCycle();
    }

    // Starts or stops the animation based on screen width
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
