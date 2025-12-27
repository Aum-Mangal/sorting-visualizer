// --- Global Variables ---
let array = [];
let size = 30;
let delay = 50;
let isSorting = false;
let abort = false; // Flag to stop sorting
let audioCtx = null; 

// Counters
let count_swaps = 0;
let count_comparisons = 0;

// --- Algorithm Data ---
const algoData = {
    bubble: {
        name: "Bubble Sort",
        time: "O(n²)",
        space: "O(1)",
        desc: "Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. The largest element 'bubbles' to the top in each pass."
    },
    selection: {
        name: "Selection Sort",
        time: "O(n²)",
        space: "O(1)",
        desc: "Divides the list into a sorted and unsorted region. It repeatedly finds the minimum element from the unsorted region and moves it to the sorted region."
    },
    insertion: {
        name: "Insertion Sort",
        time: "O(n²)",
        space: "O(1)",
        desc: "Builds the sorted array one item at a time. It picks an element and inserts it into its correct position within the already sorted part of the array."
    },
    merge: {
        name: "Merge Sort",
        time: "O(n log n)",
        space: "O(n)",
        desc: "A Divide and Conquer algorithm. It divides the input array into two halves, recursively sorts them, and then merges the two sorted halves."
    },
    quick: {
        name: "Quick Sort",
        time: "O(n log n)",
        space: "O(log n)",
        desc: "Picks a 'pivot' element and partitions the array: elements smaller than pivot go left, larger go right. Recursively sorts the partitions."
    },
    heap: {
        name: "Heap Sort",
        time: "O(n log n)",
        space: "O(1)",
        desc: "Converts the array into a Binary Heap (max-heap). It repeatedly extracts the maximum element from the root and places it at the end of the array."
    }
};

// --- DOM Elements ---
const container = document.getElementById("array-container");
const speedInput = document.getElementById("speedRange");
const sizeInput = document.getElementById("sizeRange");
const stopBtn = document.getElementById("stopBtn");

// --- Event Listeners ---
speedInput.addEventListener("input", e => {
    delay = 305 - parseInt(e.target.value);
    document.getElementById("speedVal").innerText = e.target.value;
});

sizeInput.addEventListener("input", e => {
    size = parseInt(e.target.value);
    document.getElementById("sizeVal").innerText = size;
    generateArray();
});

// --- Audio System ---
function playNote(freq) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.01); // Volume 0.05 (Low)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// --- Helpers ---
// The crucial sleep function that listens for the abort flag
function sleep() {
    return new Promise((resolve, reject) => {
        if (abort) {
            reject(new Error("Stopped")); 
            return;
        }
        setTimeout(() => {
            if (abort) reject(new Error("Stopped"));
            else resolve();
        }, delay);
    });
}

function updateStats(type) {
    if (type === 'comp') {
        count_comparisons++;
        document.getElementById("compCount").innerText = count_comparisons;
    } else if (type === 'swap') {
        count_swaps++;
        document.getElementById("swapCount").innerText = count_swaps;
    }
}

function resetStats() {
    count_comparisons = 0;
    count_swaps = 0;
    document.getElementById("compCount").innerText = "0";
    document.getElementById("swapCount").innerText = "0";
}

function updateInfo(key) {
    const data = algoData[key];
    document.getElementById("algoTitle").innerText = data.name;
    document.getElementById("algoDesc").innerText = data.desc;
    document.getElementById("timeComp").innerText = data.time;
    document.getElementById("spaceComp").innerText = data.space;
}

function generateArray() {
    if (isSorting) return;
    array = [];
    resetStats();
    container.innerHTML = "";
    document.getElementById("algoTitle").innerText = "Ready";
    document.getElementById("algoDesc").innerText = "Adjust size and speed, then pick an algorithm.";
    
    // Calculate width dynamically
    const width = Math.max(2, Math.floor(container.clientWidth / size) - 3);
    
    for (let i = 0; i < size; i++) {
        let val = Math.floor(Math.random() * 350) + 20;
        array.push(val);
        let bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = val + "px";
        bar.style.width = width + "px";
        container.appendChild(bar);
    }
}

function stopSorting() {
    if(isSorting) {
        abort = true;
    }
}

// --- Main Runner ---
async function runAlgo(key) {
    if (isSorting) return;
    
    // Init Audio Context on first interaction
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    isSorting = true;
    abort = false;
    resetStats();
    updateInfo(key);
    
    // UI State: Disable algos, Enable Stop
    const algoBtns = document.querySelectorAll(".btn-group button");
    const newArrayBtn = document.querySelector(".new-array-btn");
    
    algoBtns.forEach(b => b.disabled = true);
    newArrayBtn.disabled = true;
    sizeInput.disabled = true;
    stopBtn.disabled = false;

    try {
        switch(key) {
            case 'bubble': await bubbleSort(); break;
            case 'selection': await selectionSort(); break;
            case 'insertion': await insertionSort(); break;
            case 'merge': await mergeSortRunner(); break;
            case 'quick': await quickSortRunner(); break;
            case 'heap': await heapSort(); break;
        }
    } catch (error) {
        if (error.message === "Stopped") {
            // Reset colors on stop
            const bars = document.getElementsByClassName("bar");
            for(let bar of bars) bar.style.background = "#38bdf8";
        } else {
            console.error(error);
        }
    }

    // UI State: Re-enable algos, Disable Stop
    algoBtns.forEach(b => b.disabled = false);
    newArrayBtn.disabled = false;
    sizeInput.disabled = false;
    stopBtn.disabled = true;
    isSorting = false;
}

// --- Algorithms (With Abort & Audio Checks) ---

async function bubbleSort() {
    const bars = document.getElementsByClassName("bar");
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size - i - 1; j++) {
            bars[j].style.background = "#ef4444"; // Compare
            bars[j + 1].style.background = "#ef4444";
            
            updateStats('comp');
            await sleep();

            if (array[j] > array[j + 1]) {
                updateStats('swap');
                playNote(200 + array[j]);
                
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
                bars[j].style.height = array[j] + "px";
                bars[j + 1].style.height = array[j + 1] + "px";
            }
            
            bars[j].style.background = "#38bdf8"; 
            bars[j + 1].style.background = "#38bdf8";
        }
        bars[size - i - 1].style.background = "#22c55e"; // Sorted
    }
    bars[0].style.background = "#22c55e";
}

async function selectionSort() {
    const bars = document.getElementsByClassName("bar");
    for (let i = 0; i < size; i++) {
        let min = i;
        bars[i].style.background = "#eab308"; // Current Min Indicator
        
        for (let j = i + 1; j < size; j++) {
            bars[j].style.background = "#ef4444"; // Scan
            updateStats('comp');
            await sleep();

            if (array[j] < array[min]) {
                if(min !== i) bars[min].style.background = "#38bdf8";
                min = j;
                bars[min].style.background = "#eab308"; // New Min
                playNote(300 + array[min]);
            } else {
                bars[j].style.background = "#38bdf8";
            }
        }
        if (min !== i) {
            updateStats('swap');
            [array[i], array[min]] = [array[min], array[i]];
            bars[i].style.height = array[i] + "px";
            bars[min].style.height = array[min] + "px";
        }
        bars[min].style.background = "#38bdf8";
        bars[i].style.background = "#22c55e";
    }
}

async function insertionSort() {
    const bars = document.getElementsByClassName("bar");
    bars[0].style.background = "#22c55e";
    
    for (let i = 1; i < size; i++) {
        let key = array[i];
        let j = i - 1;
        let h = bars[i].style.height;
        bars[i].style.background = "#eab308";
        
        await sleep();

        while (j >= 0 && array[j] > key) {
            updateStats('comp');
            updateStats('swap'); 
            playNote(200 + array[j]);
            
            array[j + 1] = array[j];
            bars[j + 1].style.height = array[j] + "px";
            bars[j + 1].style.background = "#22c55e"; 
            j--;
            await sleep();
        }
        if(j >= 0) updateStats('comp');
        
        array[j + 1] = key;
        bars[j + 1].style.height = h;
        bars[i].style.background = "#22c55e";
    }
}

async function finishAnimation() {
    const bars = document.getElementsByClassName("bar");
    for (let k = 0; k < size; k++) {
        bars[k].style.background = "#22c55e";
        playNote(600 + k * 5);
        // We use a mini-sleep here that doesn't check abort 
        // because we want the "finish" flourish to complete nicely
        await new Promise(r => setTimeout(r, 10)); 
    }
}

async function mergeSortRunner() {
    await mergeSort(0, size - 1);
    if (!abort) await finishAnimation();
}

async function mergeSort(l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    await mergeSort(l, m);
    await mergeSort(m + 1, r);
    await merge(l, m, r);
}

async function merge(l, m, r) {
    const bars = document.getElementsByClassName("bar");
    let left = array.slice(l, m + 1);
    let right = array.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;

    while (i < left.length && j < right.length) {
        updateStats('comp');
        bars[k].style.background = "#eab308";
        playNote(200 + array[k]);
        
        if (left[i] <= right[j]) {
            array[k] = left[i];
            i++;
        } else {
            array[k] = right[j];
            j++;
        }
        bars[k].style.height = array[k] + "px";
        await sleep();
        bars[k].style.background = "#38bdf8";
        k++;
    }
    while (i < left.length) {
        bars[k].style.background = "#eab308";
        array[k] = left[i];
        bars[k].style.height = array[k] + "px";
        await sleep();
        bars[k].style.background = "#38bdf8";
        i++; k++;
    }
    while (j < right.length) {
        bars[k].style.background = "#eab308";
        array[k] = right[j];
        bars[k].style.height = array[k] + "px";
        await sleep();
        bars[k].style.background = "#38bdf8";
        j++; k++;
    }
}

async function quickSortRunner() {
    await quickSort(0, size - 1);
    if (!abort) await finishAnimation();
}

async function quickSort(l, r) {
    if (l < r) {
        let p = await partition(l, r);
        await quickSort(l, p - 1);
        await quickSort(p + 1, r);
    }
}

async function partition(l, r) {
    const bars = document.getElementsByClassName("bar");
    let pivot = array[r];
    bars[r].style.background = "#eab308";
    
    let i = l - 1;
    for (let j = l; j < r; j++) {
        bars[j].style.background = "#ef4444";
        updateStats('comp');
        await sleep();

        if (array[j] < pivot) {
            i++;
            updateStats('swap');
            playNote(200 + array[i]);
            [array[i], array[j]] = [array[j], array[i]];
            bars[i].style.height = array[i] + "px";
            bars[j].style.height = array[j] + "px";
        }
        bars[j].style.background = "#38bdf8";
    }
    updateStats('swap');
    [array[i + 1], array[r]] = [array[r], array[i + 1]];
    bars[i + 1].style.height = array[i + 1] + "px";
    bars[r].style.height = array[r] + "px";
    bars[r].style.background = "#38bdf8";
    
    return i + 1;
}

async function heapSort() {
    const bars = document.getElementsByClassName("bar");
    for (let i = Math.floor(size / 2) - 1; i >= 0; i--) await heapify(size, i);

    for (let i = size - 1; i > 0; i--) {
        updateStats('swap');
        [array[0], array[i]] = [array[i], array[0]];
        bars[0].style.height = array[0] + "px";
        bars[i].style.height = array[i] + "px";
        bars[i].style.background = "#22c55e";
        playNote(400);
        
        await sleep();
        await heapify(i, 0);
    }
    bars[0].style.background = "#22c55e";
}

async function heapify(n, i) {
    const bars = document.getElementsByClassName("bar");
    let largest = i;
    let l = 2 * i + 1;
    let r = 2 * i + 2;

    updateStats('comp');
    if (l < n && array[l] > array[largest]) largest = l;
    updateStats('comp');
    if (r < n && array[r] > array[largest]) largest = r;

    if (largest != i) {
        updateStats('swap');
        playNote(200 + array[i]);
        [array[i], array[largest]] = [array[largest], array[i]];
        bars[i].style.height = array[i] + "px";
        bars[largest].style.height = array[largest] + "px";
        await sleep();
        await heapify(n, largest);
    }
}

// Init
generateArray();