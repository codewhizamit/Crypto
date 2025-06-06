const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
const textInput = document.querySelector('#textCommand');
const sendBtn = document.querySelector('.send');
const greetingText = document.querySelector('#greeting');
const historyDiv = document.querySelector('#history');
const historyBtn = document.querySelector('.history-btn');
const historySidebar = document.querySelector('.history-sidebar');
const newChatBtn = document.querySelector('.new-chat');
const themeToggleBtn = document.querySelector('.theme-toggle');
const userProfileForm = document.querySelector('#user-profile-form');
const reminderNotification = document.querySelector('#reminder-notification');
const reminderText = document.querySelector('#reminder-text');
const logoutBtn = document.querySelector('.logout-btn');
const closeHistoryBtn = document.querySelector('.close-history');

// Use the provided Groq API key (WARNING: Do not expose in production)
const GROQ_API_KEY = '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';

// Personalization variables
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || null;
let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];
let customCommands = JSON.parse(localStorage.getItem('customCommands')) || {};

// Show user profile form if no profile exists
if (!userProfile) {
    userProfileForm.style.display = 'block';
} else {
    userProfileForm.style.display = 'none';
    updateGreeting();
}

// Handle user profile submission
document.querySelector('#submitProfile').addEventListener('click', () => {
    const name = document.querySelector('#userName').value.trim();
    const favoriteTech = document.querySelector('#favoriteTech').value.trim();
    const language = document.querySelector('#language').value.trim();
    const tonePreference = document.querySelector('#tonePreference').value;

    if (name && favoriteTech && language) {
        userProfile = {
            name,
            favoriteTech,
            language,
            tonePreference
        };
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        userProfileForm.style.display = 'none';
        updateGreeting();
        wishMe();
    } else {
        alert('Please fill in all fields.');
    }
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    userProfile = null;
    localStorage.removeItem('userProfile');
    conversationHistory = [];
    localStorage.removeItem('conversationHistory');
    customCommands = {};
    localStorage.removeItem('customCommands');
    userProfileForm.style.display = 'block';
    greetingText.textContent = "I am Crypto, your tech-savvy Virtual Assistant. Let’s set up your profile!";
    content.textContent = "Click here to speak";
    speak("You have been logged out. Please set up your profile again.");
    historySidebar.classList.remove('active');
    loadHistory();
});

// History sidebar toggle
historyBtn.addEventListener('click', () => {
    historySidebar.classList.toggle('active');
});

// Close history sidebar
closeHistoryBtn.addEventListener('click', () => {
    historySidebar.classList.remove('active');
});

// New chat
newChatBtn.addEventListener('click', () => {
    conversationHistory = [];
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    loadHistory();
    speak("Starting a new chat!");
    historySidebar.classList.remove('active');
});

// Load conversation history
function loadHistory() {
    historyDiv.innerHTML = '';
    conversationHistory.forEach(entry => {
        const userEntry = document.createElement('p');
        userEntry.className = 'user';
        userEntry.textContent = `You: ${entry.command}`;
        historyDiv.appendChild(userEntry);

        const botEntry = document.createElement('p');
        botEntry.className = 'bot';
        botEntry.textContent = `Crypto: ${entry.response}`;
        historyDiv.appendChild(botEntry);
    });
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// Theme toggle
const isLightTheme = localStorage.getItem('theme') === 'light';
if (isLightTheme) {
    document.body.classList.add('light');
    themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
}
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    themeToggleBtn.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

function speak(text) {
    window.speechSynthesis.cancel();
    
    const text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1;
    text_speak.volume = 1;
    text_speak.pitch = 1;
    window.speechSynthesis.speak(text_speak);
}

function updateGreeting() {
    greetingText.textContent = `I am Crypto, your tech-savvy Virtual Assistant, ${userProfile.name}. How may I help you?`;
}

function wishMe() {
    if (!userProfile) return;
    const day = new Date();
    const hour = day.getHours();
    const greeting = hour >= 0 && hour < 12 ? "Good Morning" : hour >= 12 && hour < 17 ? "Good Afternoon" : "Good Evening";
    const personalizedGreeting = userProfile.tonePreference === 'formal' 
        ? `${greeting}, ${userProfile.name}. I know you're interested in ${userProfile.favoriteTech}. How may I assist you today?`
        : `${greeting}, ${userProfile.name}! I see you’re into ${userProfile.favoriteTech}. How can I help you today?`;
    speak(personalizedGreeting);
}

window.addEventListener('load', () => {
    if (userProfile) {
        speak(`Initializing CRYPTO for ${userProfile.name}...`);
        wishMe();
        loadHistory();
    }
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
};

btn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    recognition.stop();
    
    content.textContent = "Listening...";
    recognition.start();
});

sendBtn.addEventListener('click', () => {
    const command = textInput.value.trim();
    if (command) {
        window.speechSynthesis.cancel();
        recognition.stop();
        
        content.textContent = command;
        textInput.value = '';
        takeCommand(command.toLowerCase());
    }
});

textInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendBtn.click();
    }
});

async function queryGroq(message) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are Crypto, a virtual assistant specializing in current technology and knowledge in the tech field. The user's favorite tech topic is ${userProfile.favoriteTech}, and they prefer responses in a ${userProfile.tonePreference} tone. Provide concise, accurate, and helpful answers in ${userProfile.language}.`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your Groq API key and try again.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        }

        const data = await response.json();
        const answer = data.choices[0].message.content.trim();
        return answer;
    } catch (error) {
        console.error('Error querying Groq API:', error.message);
        return userProfile.tonePreference === 'formal' 
            ? `My apologies, ${userProfile.name}. ${error.message}`
            : `Sorry, ${userProfile.name}! ${error.message}`;
    }
}

async function getTechNews() {
    try {
        const response = await fetch('https://newsapi.org/v2/top-headlines?category=technology&apiKey=YOUR_NEWS_API_KEY');
        if (!response.ok) {
            throw new Error('Unable to fetch news.');
        }
        const data = await response.json();
        const article = data.articles[0];
        return `Here’s the latest tech news: ${article.title} - ${article.description}`;
    } catch (error) {
        console.error('Error fetching tech news:', error.message);
        return null;
    }
}

async function getWeather(location) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=YOUR_OPENWEATHERMAP_API_KEY&units=metric`);
        if (!response.ok) {
            throw new Error('Unable to fetch weather data.');
        }
        const data = await response.json();
        const temp = data.main.temp;
        const description = data.weather[0].description;
        return `The weather in ${location} is ${description} with a temperature of ${temp}°C.`;
    } catch (error) {
        console.error('Error fetching weather:', error.message);
        return null;
    }
}

function tellJoke() {
    const jokes = [
        "Why did the computer go to school? It wanted to improve its *byte*!",
        "Why do programmers prefer dark mode? Because the light attracts bugs!",
        "What do you call a fake tech product? A *digital dud*!",
        "Why did the smartphone go to jail? It couldn’t stop breaking the *code*!",
        "How does a techie say goodbye? *Catch you in the cloud!*"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
}

function setReminder(task, minutes) {
    const delay = minutes * 60 * 1000;
    setTimeout(() => {
        const reminderMessage = userProfile.tonePreference === 'formal' 
            ? `Reminder: ${task}.`
            : `Hey ${userProfile.name}, don’t forget: ${task}!`;
        reminderText.textContent = reminderMessage;
        reminderNotification.style.display = 'block';
        speak(reminderMessage);
        setTimeout(() => {
            reminderNotification.style.display = 'none';
        }, 10000);
    }, delay);
}

function saveConversation(command, response) {
    conversationHistory.push({ command, response });
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    loadHistory();
}

function takeCommand(message) {
    if (!userProfile) {
        const response = "Please complete your profile setup first.";
        speak(response);
        return;
    }

    if (customCommands[message]) {
        const action = customCommands[message];
        if (action.startsWith('open ')) {
            const url = action.replace('open ', '');
            window.open(url, "_blank");
            const response = `Opening ${url}...`;
            speak(response);
            saveConversation(message, response);
        } else {
            speak(action);
            saveConversation(message, action);
        }
        return;
    }

    if (message.includes("play") && message.includes("on youtube")) {
        const query = message.replace("play", "").replace("on youtube", "").trim();
        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        window.open(youtubeUrl, "_blank");
        const response = userProfile.tonePreference === 'formal' 
            ? `Searching for "${query}" on YouTube.`
            : `Playing "${query}" on YouTube for you!`;
        speak(response);
        saveConversation(message, response);
    } else if (message.includes("open") && message.includes("website")) {
        const site = message.replace("open", "").replace("website", "").trim();
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(site + " official website")}`;
        window.open(googleSearchUrl, "_blank");
        const response = userProfile.tonePreference === 'formal' 
            ? `Searching for the official website of ${site} on Google.`
            : `Looking up the ${site} website for you!`;
        speak(response);
        saveConversation(message, response);
    } else if (message.includes("weather in")) {
        const location = message.replace("weather in", "").replace("what's the", "").trim();
        content.textContent = "Fetching weather...";
        getWeather(location).then(weather => {
            let response;
            if (weather) {
                response = userProfile.tonePreference === 'formal' 
                    ? weather
                    : `Here’s the weather: ${weather}`;
            } else {
                response = userProfile.tonePreference === 'formal' 
                    ? `I was unable to retrieve the weather for ${location}.`
                    : `Sorry, I couldn’t get the weather for ${location}!`;
            }
            content.textContent = response;
            speak(response);
            saveConversation(message, response);
        });
    } else if (message.includes("set a reminder")) {
        const parts = message.match(/set a reminder for (.*?) in (\d+) minutes/);
        if (parts && parts.length === 3) {
            const task = parts[1].trim();
            const minutes = parseInt(parts[2]);
            setReminder(task, minutes);
            const response = userProfile.tonePreference === 'formal' 
                ? `I have set a reminder for "${task}" in ${minutes} minutes.`
                : `Reminder set for "${task}" in ${minutes} minutes!`;
            speak(response);
            saveConversation(message, response);
        } else {
            const response = userProfile.tonePreference === 'formal' 
                ? "Please use the format: set a reminder for [task] in [number] minutes."
                : "Please say it like: set a reminder for [task] in [number] minutes.";
            speak(response);
            saveConversation(message, response);
        }
    } else if (message.includes("tell me a joke")) {
        const joke = tellJoke();
        const response = userProfile.tonePreference === 'formal' 
            ? `Here is a light-hearted joke for you: ${joke}`
            : `Here’s a tech joke for you: ${joke}`;
        speak(response);
        saveConversation(message, response);
    } else if (message.includes("open google")) {
        window.open("https://google.com", "_blank");
        const response = "Opening Google...";
        speak(response);
        saveConversation(message, response);
    } else if (message.includes("open youtube")) {
        window.open("https://youtube.com", "_blank");
        const response = "Opening Youtube...";
        speak(response);
        saveConversation(message, response);
    } else if (message.includes("open facebook")) {
        window.open("https://facebook.com", "_blank");
        const response = "Opening Facebook...";
        speak(response);
        saveConversation(message, response);
    } else if (message.includes('time')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        const response = userProfile.tonePreference === 'formal' 
            ? `The current time is ${time}.`
            : `It’s ${time} right now!`;
        speak(response);
        saveConversation(message, response);
    } else if (message.includes('date')) {
        const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
        const response = userProfile.tonePreference === 'formal' 
            ? `Today's date is ${date}.`
            : `Today is ${date}!`;
        speak(response);
        saveConversation(message, response);
    } else if (message.includes('calculator')) {
        window.open('Calculator:///');
        const response = "Opening Calculator";
        speak(response);
        saveConversation(message, response);
    } else if (message.includes('switch to formal tone')) {
        userProfile.tonePreference = 'formal';
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        const response = "I have switched to a formal tone as requested.";
        speak(response);
        saveConversation(message, response);
        updateGreeting();
    } else if (message.includes('switch to casual tone')) {
        userProfile.tonePreference = 'casual';
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        const response = userProfile.tonePreference === 'formal' 
            ? "I have switched to a casual tone as requested."
            : "Got it! I’m now in casual mode.";
        speak(response);
        saveConversation(message, response);
        updateGreeting();
    } else if (message.startsWith('set command ')) {
        const parts = message.split(' to ');
        if (parts.length === 2) {
            const command = parts[0].replace('set command ', '').trim();
            const action = parts[1].trim();
            customCommands[command] = action;
            localStorage.setItem('customCommands', JSON.stringify(customCommands));
            const response = userProfile.tonePreference === 'formal' 
                ? `Custom command "${command}" has been set to "${action}".`
                : `I’ve set the command "${command}" to "${action}" for you!`;
            speak(response);
            saveConversation(message, response);
        } else {
            const response = userProfile.tonePreference === 'formal' 
                ? "Please provide a valid command and action in the format: set command [command] to [action]."
                : "Please use the format: set command [command] to [action].";
            speak(response);
            saveConversation(message, response);
        }
    } else if (message.includes('latest tech news')) {
        content.textContent = "Fetching news...";
        getTechNews().then(news => {
            let response;
            if (news) {
                response = userProfile.tonePreference === 'formal' 
                    ? news
                    : `Here’s some fresh tech news for you: ${news}`;
            } else {
                response = userProfile.tonePreference === 'formal' 
                    ? `I was unable to retrieve the latest tech news at this time.`
                    : `Sorry, I couldn’t grab the latest tech news right now!`;
            }
            content.textContent = response;
            speak(response);
            saveConversation(message, response);
        });
    } else {
        content.textContent = "Processing...";
        queryGroq(message).then((response) => {
            content.textContent = response;
            speak(response);
            saveConversation(message, response);
        });
    }
}