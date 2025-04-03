class WheelApp {
    constructor() {
        this.padding = { top: 20, right: 40, bottom: 0, left: 0 };
        this.width = 400 - this.padding.left - this.padding.right;
        this.height = 400 - this.padding.top - this.padding.bottom;
        this.radius = Math.min(this.width, this.height) / 2;
        this.rotation = 0;
        this.oldrotation = 0;
        this.picked = 100000;
        this.oldpick = [];
        this.spinDuration = 3000;
        this.isMuted = false;
        this.soundsLoaded = false;
        this.currentEditingIndex = null;
        this.isYesNoWheel = false;
        
        // Update copyright year
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // Separate arrays for wheel and all options
        this.wheelData = [];
        this.allOptions = [];
        
        this.colors = [
            '#FF7B7B', '#4CD4B0', '#45B7D1', '#98D8BE',
            '#FFE17B', '#D4A5A5', '#A5A5A5', '#7FCCB6',
            '#FFB6A3', '#FF9B9B'
        ];

        // Initialize with default options
        const defaultOptions = [
            { label: "Red", value: 1, color: this.colors[0] },
            { label: "Green", value: 2, color: this.colors[1] },
            { label: "Blue", value: 3, color: this.colors[2] }
        ];

        // Add default options to both arrays
        defaultOptions.forEach(option => {
            this.allOptions.push({ ...option });
            this.wheelData.push({ ...option });
        });

        try {
            this.setupElements();
            this.createColorPickerModal();
            this.loadSounds();
            this.setupEventListeners();
            this.initWheel();
            this.updateOptionsList();
        } catch (error) {
            console.error('Error initializing wheel:', error);
        }
    }

    setupElements() {
        // Options
        this.optionInput = document.getElementById('option-input');
        this.addOptionButton = document.getElementById('add-option');
        this.optionsList = document.getElementById('options-list');

        // Ensure required elements exist
        if (!this.optionInput || !this.addOptionButton || !this.optionsList) {
            console.error('Required elements are missing. Check HTML IDs.');
            return;
        }
        
        // Modals and popups
        this.winnerPopup = document.getElementById('winnerPopup');
        this.winnerName = document.getElementById('winnerName');
        
        // Controls
        this.themeButton = document.getElementById('themeToggle');
        this.soundButton = document.getElementById('soundToggle');
        this.settingsButton = document.getElementById('settingsToggle');
        
        // Menus
        this.soundMenu = document.getElementById('soundMenu');
        this.settingsMenu = document.getElementById('settingsMenu');
        
        // Sound controls
        this.muteAll = document.getElementById('muteAll');
        this.spinVolume = document.getElementById('spinVolume');
        this.resultVolume = document.getElementById('resultVolume');
        
        // Settings controls
        this.spinSpeedControl = document.getElementById('spinSpeed');
        this.wheelSizeControl = document.getElementById('wheelSize');
        this.bgColorControl = document.getElementById('bgColor');
    }

    createColorPickerModal() {
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'colorPickerModal';
        modal.className = 'modal';

        // Create modal content
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Choose Color</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <input type="color" id="colorPicker">
                    <button class="apply-color">Apply</button>
                </div>
            </div>
        `;

        // Add modal to document
        document.body.appendChild(modal);

        // Store references
        this.colorPickerModal = modal;
        this.colorPicker = modal.querySelector('#colorPicker');
    }

    async loadSounds() {
        try {
            // Create audio contexts
            this.spinSound = new Audio('sounds/spin.mp3');
            this.resultSound = new Audio('sounds/applause.mp3');
            
            // Set default volumes
            this.spinSound.volume = 1.0;  // Keep spin sound at full volume
            this.resultSound.volume = 0.5;  // Set applause to half volume

            // Wait for all sounds to load
            await Promise.all([
                new Promise((resolve) => {
                    this.spinSound.addEventListener('canplaythrough', resolve, { once: true });
                    this.spinSound.addEventListener('error', resolve, { once: true });
                }),
                new Promise((resolve) => {
                    this.resultSound.addEventListener('canplaythrough', resolve, { once: true });
                    this.resultSound.addEventListener('error', resolve, { once: true });
                })
            ]);

            this.soundsLoaded = true;
        } catch (error) {
            console.warn('Some sounds failed to load:', error);
            this.soundsLoaded = false;
        }
    }

    // playSound(sound) {
    //     if (!this.soundsLoaded || this.isMuted) return;
    //
    //     try {
    //         // Create a new audio instance each time to allow overlapping sounds
    //         const audio = new Audio(sound.src);
    //         audio.volume = sound.volume;  // This will use the original sound's volume setting
    //         audio.play().catch(error => {
    //             console.warn('Failed to play sound:', error);
    //         });
    //     } catch (error) {
    //         console.warn('Error playing sound:', error);
    //     }
    // }

    // async playNotificationSound() {
    //     if (!this.isMuted && this.notificationSound) {
    //         try {
    //             this.notificationSound.currentTime = 0;
    //             this.notificationSound.volume = 0.5; // Reduced volume for more intense applause
    //             await this.notificationSound.play();
    //         } catch (error) {
    //             console.error('Error playing notification sound:', error);
    //         }
    //     }
    // }

    setupEventListeners() {
        // Only set up event listeners if elements exist
        if (this.addOptionButton && this.optionInput) {
            this.addOptionButton.addEventListener('click', () => this.addOption());
            this.optionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addOption();
            });
        }

        // Color picker modal
        if (this.colorPickerModal) {
            const closeModalBtn = this.colorPickerModal.querySelector('.close-modal');
            const applyColorBtn = this.colorPickerModal.querySelector('.apply-color');
            
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => {
                    this.colorPickerModal.classList.remove('active');
                });
            }

            if (applyColorBtn) {
                applyColorBtn.addEventListener('click', () => {
                    this.applyColor();
                });
            }

            // Close modal when clicking outside
            this.colorPickerModal.addEventListener('click', (e) => {
                if (e.target === this.colorPickerModal) {
                    this.colorPickerModal.classList.remove('active');
                }
            });
        }

        // Theme toggle
        if (this.themeButton) {
            this.themeButton.addEventListener('click', () => this.toggleTheme());
        }
        
        // Sound menu
        if (this.soundButton) {
            this.soundButton.addEventListener('click', () => this.toggleMenu(this.soundMenu));
        }
        if (this.muteAll) {
            this.muteAll.addEventListener('change', () => this.toggleMute());
        }
        if (this.spinVolume) {
            this.spinVolume.addEventListener('input', (e) => this.updateVolume('spin', e.target.value));
        }
        if (this.resultVolume) {
            this.resultVolume.addEventListener('input', (e) => this.updateVolume('result', e.target.value));
        }
        
        // Settings menu
        if (this.settingsButton && this.settingsMenu) {
            this.settingsButton.addEventListener('click', () => this.toggleMenu(this.settingsMenu));
        }
        if (this.spinSpeedControl) {
            this.spinSpeedControl.addEventListener('input', (e) => this.updateSpinSpeed(e.target.value));
        }
        if (this.wheelSizeControl) {
            this.wheelSizeControl.addEventListener('input', (e) => this.updateWheelSize(e.target.value));
        }
        if (this.bgColorControl) {
            this.bgColorControl.addEventListener('input', (e) => this.updateBackgroundColor(e.target.value));
        }
        
        // Close buttons for menus
        document.querySelectorAll('.close-menu').forEach(button => {
            button.addEventListener('click', (e) => {
                const menu = e.target.closest('.menu');
                if (menu) menu.classList.remove('active');
            });
        });
        
        // Winner popup
        const replayButton = document.querySelector('.replay-button');
        const continueButton = document.querySelector('.continue-button');
        const closePopupButton = document.querySelector('.close-popup');

        if (replayButton) {
            replayButton.addEventListener('click', () => {
                if (this.winnerPopup) {
                    this.winnerPopup.classList.remove('active');
                }
                this.restoreAllOptions();
                this.spin();
            });
        }

        if (continueButton) {
            continueButton.addEventListener('click', () => {
                if (this.winnerPopup) {
                    this.winnerPopup.classList.remove('active');
                }
                this.removeWinner();
                if (this.wheelData.length > 1) {
                    this.spin();
                }
            });
        }

        if (closePopupButton) {
            closePopupButton.addEventListener('click', () => {
                if (this.winnerPopup) {
                    this.winnerPopup.classList.remove('active');
                }
            });
        }
    }

    toggleMenu(menu) {
        const otherMenu = menu === this.soundMenu ? this.settingsMenu : this.soundMenu;
        otherMenu.classList.remove('active');
        menu.classList.toggle('active');
    }

    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        html.setAttribute('data-theme', isDark ? 'light' : 'dark');
        this.themeButton.innerHTML = isDark ? 
            '<i class="fas fa-moon"></i>' : 
            '<i class="fas fa-sun"></i>';
    }

    toggleMute() {
        this.isMuted = this.muteAll.checked;
        this.soundButton.innerHTML = this.isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    }

    updateVolume(type, value) {
        const sound = type === 'spin' ? this.spinSound : this.resultSound;
        sound.volume = value;
    }

    updateSpinSpeed(value) {
        this.spinDuration = 6000 - (value * 1000);
    }

    updateWheelSize(value) {
        this.width = value - this.padding.left - this.padding.right;
        this.height = value - this.padding.top - this.padding.bottom;
        this.radius = Math.min(this.width, this.height) / 2;
        
        const container = document.querySelector('.wheel-container');
        container.style.width = `${value}px`;
        container.style.height = `${value}px`;
        
        this.initWheel();
    }

    updateBackgroundColor(color) {
        document.body.style.backgroundColor = color;
    }

    openColorPicker(index) {
        this.currentEditingIndex = index;
        this.colorPicker.value = this.allOptions[index].color;
        this.colorPickerModal.classList.add('active');
    }

    applyColor() {
        if (this.currentEditingIndex !== null) {
            const newColor = this.colorPicker.value;
            // Update color in both arrays
            this.allOptions[this.currentEditingIndex].color = newColor;
            const wheelIndex = this.wheelData.findIndex(
                item => item.label === this.allOptions[this.currentEditingIndex].label
            );
            if (wheelIndex !== -1) {
                this.wheelData[wheelIndex].color = newColor;
            }
            this.updateOptionsList();
            this.initWheel();
            this.colorPickerModal.classList.remove('active');
            this.currentEditingIndex = null;
        }
    }

    getRandomColor() {
        const usedColors = this.allOptions ? this.allOptions.map(item => item.color) : [];
        const unusedColors = this.colors.filter(color => !usedColors.includes(color));
        
        if (unusedColors.length > 0) {
            return unusedColors[Math.floor(Math.random() * unusedColors.length)];
        }
        
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    removeWinner() {
        if (this.picked !== undefined && this.picked < this.wheelData.length) {
            // Only remove from wheel data, keep in all options
            this.wheelData.splice(this.picked, 1);
            this.oldpick = [];
            this.initWheel();

            // Update continue button state
            const continueBtn = document.querySelector('.continue-button');
            if (continueBtn) {
                if (this.wheelData.length <= 1) {
                    continueBtn.style.opacity = '0.5';
                    continueBtn.style.cursor = 'not-allowed';
                } else {
                    continueBtn.style.opacity = '1';
                    continueBtn.style.cursor = 'pointer';
                }
            }
        }
    }

    addOption() {
        const value = this.optionInput.value.trim();
        if (value && !this.allOptions.some(item => item.label === value)) {
            const newOption = {
                label: value,
                value: this.allOptions.length + 1,
                color: this.getRandomColor()
            };
            
            // Add to both arrays
            this.allOptions.push({ ...newOption });
            this.wheelData.push({ ...newOption });
            
            this.optionInput.value = '';
            this.updateOptionsList();
            this.initWheel();
        }
    }

    removeOption(index) {
        // Check if removing this option would leave less than 2 options
        if (this.allOptions.length <= 2) {
            alert('At least 2 options are required!');
            return;
        }

        const removedOption = this.allOptions[index];
        // Remove from both arrays
        this.allOptions.splice(index, 1);
        const wheelIndex = this.wheelData.findIndex(item => item.label === removedOption.label);
        if (wheelIndex !== -1) {
            this.wheelData.splice(wheelIndex, 1);
        }
        this.updateOptionsList();
        this.initWheel();
    }

    updateOptionsList() {
        this.optionsList.innerHTML = '';
        this.allOptions.forEach((option, index) => {
            const item = document.createElement('div');
            item.className = 'option-item';
            
            // Check if the option is in the wheel
            const isInWheel = this.wheelData.some(wheelOption => wheelOption.label === option.label);
            
            item.innerHTML = `
                <span class="color-dot" style="color: ${option.color}" onclick="wheelApp.openColorPicker(${index})">⬤</span>
                ${option.label}
                <div class="option-controls">
                    ${!isInWheel ? 
                        `<button class="add-to-wheel" onclick="wheelApp.addToWheel(${index})">
                            <i class="fas fa-plus-circle"></i>
                        </button>` : ''
                    }
                    ${this.allOptions.length > 2 ? 
                        `<button class="delete-button" onclick="wheelApp.removeOption(${index})">
                            <i class="fas fa-trash"></i>
                        </button>` : ''
                    }
                </div>
            `;
            this.optionsList.appendChild(item);
        });
    }

    addToWheel(index) {
        const option = this.allOptions[index];
        if (!this.wheelData.some(item => item.label === option.label)) {
            this.wheelData.push({ ...option });
            this.initWheel();
            this.updateOptionsList();
        }
    }

    loadPreset(type) {
        switch(type) {
            case 'yesno':
                this.allOptions = [
                    { label: "Yes", value: 1, color: "#2ecc71" },
                    { label: "No", value: 2, color: "#e74c3c" }
                ];
                this.isYesNoWheel = true;
                break;
            case 'colors':
                this.allOptions = [
                    { label: "Red", value: 1, color: "#e74c3c" },
                    { label: "Blue", value: 2, color: "#3498db" },
                    { label: "Green", value: 3, color: "#2ecc71" },
                    { label: "Purple", value: 4, color: "#9b59b6" },
                    { label: "Orange", value: 5, color: "#e67e22" },
                    { label: "Yellow", value: 6, color: "#f1c40f" },
                    { label: "Pink", value: 7, color: "#e84393" }
                ];
                this.isYesNoWheel = false;
                break;
            case 'numbers':
                this.allOptions = Array.from({length: 10}, (_, i) => ({
                    label: (i + 1).toString(),
                    value: i + 1,
                    color: this.colors[i % this.colors.length]
                }));
                this.isYesNoWheel = false;
                break;
            case 'names':
                this.allOptions = [
                    { label: "Person 1", value: 1, color: this.colors[0] },
                    { label: "Person 2", value: 2, color: this.colors[1] },
                    { label: "Person 3", value: 3, color: this.colors[2] },
                    { label: "Person 4", value: 4, color: this.colors[3] }
                ];
                this.isYesNoWheel = false;
                break;
        }
        
        // Reset wheel data with new options
        this.wheelData = [...this.allOptions];
        this.updateOptionsList();
        this.initWheel();
    }

    initWheel() {
        // Use wheelData instead of data for the wheel
        const data = this.wheelData;
        // Clear previous wheel if any
        d3.select('#chart').html('');

        const svg = d3.select('#chart')
            .append("svg")
            .data([data])
            .attr("width", this.width + this.padding.left + this.padding.right)
            .attr("height", this.height + this.padding.top + this.padding.bottom);

        const container = svg.append("g")
            .attr("class", "chartholder")
            .attr("transform", "translate(" + (this.width/2 + this.padding.left) + "," + (this.height/2 + this.padding.top) + ")");

        this.vis = container.append("g");

        const pie = d3.layout.pie().sort(null).value(() => 1);
        const arc = d3.svg.arc().outerRadius(this.radius);

        const arcs = this.vis.selectAll("g.slice")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "slice");

        arcs.append("path")
            .attr("fill", (d, i) => data[i].color)
            .attr("d", arc);

        arcs.append("text")
            .attr("transform", (d) => {
                d.innerRadius = 0;
                d.outerRadius = this.radius;
                d.angle = (d.startAngle + d.endAngle)/2;
                return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")translate(" + (d.outerRadius - 10) + ")";
            })
            .attr("text-anchor", "end")
            .text((d, i) => data[i].label)
            .style("fill", "white")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.3)");

        // Add pointer
        svg.append("g")
            .attr("transform", "translate(" + (this.width + this.padding.left + this.padding.right - 20) + "," + ((this.height/2) + this.padding.top) + ")")
            .append("path")
            .attr("d", "M-" + (this.radius * 0.15) + ",0L0," + (this.radius * 0.05) + "L0,-" + (this.radius * 0.05) + "Z")
            .style("fill", "#45B7D1");

        // Add spin button with border
        const spinButtonGroup = container.append("g")
            .style("cursor", "pointer")
            .on("click", () => this.spin());

        // Add outer border circle
        spinButtonGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 48)
            .style("fill", "none")
            .style("stroke", "#ff8b8b")
            .style("stroke-width", "3px");

        // Add main button circle
        spinButtonGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 45)
            .style("fill", "#ff6b6b");

        // Add text
        spinButtonGroup.append("text")
            .attr("x", 0)
            .attr("y", 8)
            .attr("text-anchor", "middle")
            .text("SPIN")
            .style("font-weight", "bold")
            .style("font-size", "16px")
            .style("fill", "white")
            .style("cursor", "pointer");
    }

    spin() {
        // If there's only one option, restore all options and spin
        if (this.wheelData.length <= 1) {
            this.restoreAllOptions();
        }

        // Now proceed with spin since we have all options
        const data = this.wheelData;
        if (this.oldpick.length == data.length) {
            this.oldpick = [];
            this.rotation = 0;
            this.oldrotation = 0;
        }

        const ps = 360 / data.length;
        const rng = Math.floor((Math.random() * 1440) + 360);
        
        this.rotation = Math.round(rng / ps) * ps;
        
        this.picked = Math.round(data.length - (this.rotation % 360) / ps);
        this.picked = this.picked >= data.length ? (this.picked % data.length) : this.picked;

        if (this.oldpick.indexOf(this.picked) !== -1) {
            this.spin();
            return;
        }

        this.oldpick.push(this.picked);
        this.rotation += 90 - Math.round(ps/2);

        // Play spin sound
        const spinAudio = new Audio(this.spinSound.src);
        spinAudio.volume = this.spinSound.volume;
        if (!this.isMuted) {
            spinAudio.play().catch(error => console.warn('Failed to play spin sound:', error));
        }

        this.vis.transition()
            .duration(this.spinDuration)
            .attrTween("transform", () => {
                const i = d3.interpolate(this.oldrotation % 360, this.rotation);
                return (t) => "rotate(" + i(t) + ")";
            })
            .each("end", () => {
                // Play result sound
                const resultAudio = new Audio(this.resultSound.src);
                resultAudio.volume = this.resultSound.volume;
                if (!this.isMuted) {
                    resultAudio.play().catch(error => console.warn('Failed to play result sound:', error));
                }
                this.showWinnerPopup();
                this.oldrotation = this.rotation;
            });
    }

    showWinnerPopup() {
        if (!this.isMuted && this.resultSound) {
            try {
                this.resultSound.currentTime = 0;
                this.resultSound.volume = 0.5;
                this.resultSound.play().catch(error => {
                    console.warn('Failed to play result sound:', error);
                });
            } catch (error) {
                console.warn('Error playing result sound:', error);
            }
        }
        
        this.winnerName.textContent = this.wheelData[this.picked].label;
        this.winnerPopup.classList.add('active');
        
        // Show/hide continue button based on wheel type
        const continueButton = document.querySelector('.continue-button');
        if (this.isYesNoWheel) {
            continueButton.style.display = 'none';
        } else {
            continueButton.style.display = 'block';
        }
        
        // Trigger confetti with original timing and multiple bursts
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 1500
        };

        function fire(particleRatio, opts) {
            party.confetti(document.body, {
                count: party.variation.range(0, 100),
                size: party.variation.range(0.6, 1.4),
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });

        fire(0.2, {
            spread: 60,
        });

        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }

    restoreAllOptions() {
        // Clear the wheel data and copy all options back
        this.wheelData = this.allOptions.map(option => ({ ...option }));
        this.oldpick = []; // Reset the picked options
        this.initWheel();
        this.updateOptionsList();
        
        // Re-enable continue button if it was disabled
        const continueBtn = document.querySelector('.continue-button');
        if (continueBtn) {
            continueBtn.style.opacity = '1';
            continueBtn.style.cursor = 'pointer';
        }
    }
}

// Initialize the app
const wheelApp = new WheelApp();
