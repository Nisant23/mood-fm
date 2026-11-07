const API_SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

const stations = [
  {
    name: 'Bollywood',
    emoji: '🎬',
    description: 'Best Hindi Bollywood music',
    frequency: '88.3',
    searchTerms: ['bollywood', 'hindi bollywood', 'radio mirchi', 'hindi'],
    language: 'hindi',
    fallbackTerms: ['bollywood', 'hindi'],
  },
  {
    name: 'Gujarati',
    emoji: '💛',
    description: 'Popular Gujarati songs',
    frequency: '89.1',
    searchTerms: [
      'gujarati radio',
      'gujarati',
      'gujarat radio',
      'radio city gujarati',
      'gujarat',
    ],
    language: 'gujarati',
    fallbackTerms: ['gujarati', 'gujarat'],
  },
  {
    name: 'Romantic',
    emoji: '❤️',
    description: 'Hindi romantic and love songs',
    frequency: '90.2',
    searchTerms: [
      'hindi romantic',
      'romantic hindi',
      'hindi love songs',
      'radio mirchi',
      'hindi',
    ],
    language: 'hindi',
    fallbackTerms: ['bollywood', 'hindi'],
  },
  {
    name: 'Retro',
    emoji: '📻',
    description: 'Iconic 90s and 2000s Hindi songs',
    frequency: '91.4',
    searchTerms: [
      'hindi 90s',
      '90s hindi',
      'hindi 2000s',
      'hindi oldies',
      'radio mirchi',
      'hindi',
    ],
    language: 'hindi',
    fallbackTerms: ['bollywood', 'hindi'],
  },
  {
    name: 'Garba',
    emoji: '💃',
    description: 'Popular Gujarati Garba songs',
    frequency: '93.6',
    searchTerms: [
      'garba',
      'gujarati garba',
      'garba radio',
      'gujarati',
      'gujarat',
    ],
    language: 'gujarati',
    fallbackTerms: ['gujarati', 'gujarat'],
  },
  {
    name: 'Workout',
    emoji: '🔥',
    description: 'Bollywood workout and dance energy',
    frequency: '94.7',
    searchTerms: [
      'bollywood dance',
      'hindi dance',
      'bollywood hits',
      'radio mirchi',
      'hindi',
    ],
    language: 'hindi',
    fallbackTerms: ['bollywood', 'hindi'],
  },
  {
    name: 'Lo-fi',
    emoji: '🌙',
    description: 'Relaxing Hindi lo-fi and chill music',
    frequency: '95.8',
    searchTerms: [
      'hindi lofi',
      'bollywood lofi',
      'hindi chill',
      'hindi acoustic',
      'radio mirchi',
      'hindi',
    ],
    language: 'hindi',
    fallbackTerms: ['bollywood', 'hindi'],
  },
  {
    name: 'Party',
    emoji: '🎉',
    description: 'Bollywood party and dance hits',
    frequency: '96.9',
    searchTerms: [
      'bollywood party',
      'bollywood dance',
      'hindi dance',
      'bollywood hits',
      'radio mirchi',
      'hindi',
    ],
    language: 'hindi',
    fallbackTerms: ['bollywood', 'hindi'],
  },
];

const audio = document.getElementById('audio');
let selected = -1;
let currentStationList = [];
let currentTrack = 0;
let favorites = JSON.parse(localStorage.getItem('moodFMFavorites') || '[]');

function setStatus(message) {
  document.getElementById('status').textContent = message;
}

function renderStations() {
  const search = document.getElementById('search').value.toLowerCase();

  const filtered = stations
    .map((station, index) => ({ ...station, index }))
    .filter((station) => station.name.toLowerCase().includes(search));

  document.getElementById('stationCount').textContent =
    filtered.length + ' categories';

  document.getElementById('stations').innerHTML = filtered
    .map(
      (station) => `
      <div class="station ${selected === station.index ? 'active' : ''}"
        onclick="selectStation(${station.index})">
        <button class="fav ${
          favorites.includes(station.name) ? 'selected' : ''
        }"
          onclick="event.stopPropagation();toggleFavorite('${station.name}')">
          ${favorites.includes(station.name) ? '♥' : '♡'}
        </button>
        <div class="emoji">${station.emoji}</div>
        <h3>${station.name}</h3>
        <p>${station.description}</p>
      </div>
    `
    )
    .join('');
}

async function fetchFromRadioBrowser(url) {
  for (const server of API_SERVERS) {
    try {
      const fullUrl = url.replace('API_SERVER', server);

      console.log('Trying:', fullUrl);

      const response = await fetch(fullUrl);

      console.log('Response status:', response.status);

      if (!response.ok) continue;

      const data = await response.json();

      console.log('Stations found:', data.length);

      return data;
    } catch (error) {
      console.error('API error:', error);
      continue;
    }
  }

  return [];
}

function cleanStations(data) {
  return data.filter((station) => {
    const streamUrl = station.url_resolved || station.url;

    return streamUrl && streamUrl.startsWith('http');
  });
}

async function getRadioStations(category) {
  let foundStations = [];

  async function searchStations(term, useLanguage) {
    const encodedTerm = encodeURIComponent(term);

    const language =
      useLanguage && category.language
        ? `&language=${encodeURIComponent(category.language)}`
        : '';

    const url =
      `API_SERVER/json/stations/search?name=${encodedTerm}` +
      `&limit=40&hidebroken=true${language}`;

    const result = await fetchFromRadioBrowser(url);

    return cleanStations(result);
  }

  for (const term of category.searchTerms) {
    foundStations = await searchStations(term, true);

    if (foundStations.length > 0) {
      return foundStations;
    }
  }

  for (const term of category.searchTerms) {
    foundStations = await searchStations(term, false);

    if (foundStations.length > 0) {
      return foundStations;
    }
  }

  for (const term of category.fallbackTerms) {
    foundStations = await searchStations(term, true);

    if (foundStations.length > 0) {
      return foundStations;
    }
  }

  for (const term of category.fallbackTerms) {
    foundStations = await searchStations(term, false);

    if (foundStations.length > 0) {
      return foundStations;
    }
  }

  return [];
}

function playCurrentStation() {
  const radio = currentStationList[currentTrack];

  if (!radio) {
    setStatus('No station found for this category.');
    return;
  }

  const streamUrl = radio.url_resolved || radio.url;

  document.getElementById('playingName').textContent = radio.name;
  document.getElementById('playStatus').textContent = 'Connecting...';
  setStatus(`Connecting to ${radio.name}...`);

  audio.src = streamUrl;
  audio.load();

  audio
    .play()
    .then(() => {
      document.getElementById('playButton').textContent = 'Ⅱ';
      document.getElementById('playStatus').textContent = 'Now playing';
      setStatus(`Now playing: ${radio.name}`);
    })
    .catch((error) => {
      console.error('Playback error:', error);
      tryNextStation();
    });
}

function tryNextStation() {
  if (currentTrack + 1 < currentStationList.length) {
    currentTrack++;
    playCurrentStation();
  } else {
    document.getElementById('playButton').textContent = '▶';
    document.getElementById('playStatus').textContent = 'Playback unavailable';
    setStatus('No working stream found. Try another category.');
  }
}

async function selectStation(index) {
  const category = stations[index];
  selected = index;

  document.getElementById('frequency').textContent = category.frequency;
  document.getElementById('currentName').textContent = category.name;
  document.getElementById('currentDescription').textContent =
    category.description;
  document.getElementById('playingName').textContent = category.name;
  document.getElementById('playStatus').textContent = 'Loading...';
  document.getElementById('playButton').textContent = '▶';

  setStatus(`Finding ${category.name} stations...`);
  renderStations();

  currentStationList = await getRadioStations(category);
  currentTrack = 0;

  if (currentStationList.length === 0) {
    setStatus(
      `No online stations found for ${category.name}. Try again or choose another category.`
    );
    return;
  }

  playCurrentStation();
}

function togglePlay() {
  if (selected < 0) {
    alert('Please select a category first.');
    return;
  }

  if (audio.paused) {
    if (!audio.src) {
      playCurrentStation();
      return;
    }

    audio
      .play()
      .then(() => {
        document.getElementById('playButton').textContent = 'Ⅱ';
        document.getElementById('playStatus').textContent = 'Now playing';
      })
      .catch(() => {
        setStatus('Unable to play this stream.');
      });
  } else {
    audio.pause();
    document.getElementById('playButton').textContent = '▶';
    document.getElementById('playStatus').textContent = 'Paused';
  }
}

function nextStation() {
  if (currentStationList.length > 0) {
    currentTrack = (currentTrack + 1) % currentStationList.length;
    playCurrentStation();
    return;
  }

  selectStation((selected + 1) % stations.length);
}

function previousStation() {
  if (currentStationList.length > 0) {
    currentTrack =
      (currentTrack - 1 + currentStationList.length) %
      currentStationList.length;
    playCurrentStation();
    return;
  }

  selectStation((selected - 1 + stations.length) % stations.length);
}

function toggleMute() {
  audio.muted = !audio.muted;
}

document.getElementById('volume').addEventListener('input', function () {
  audio.volume = Number(this.value);
});

function toggleFavorite(name) {
  if (favorites.includes(name)) {
    favorites = favorites.filter((item) => item !== name);
  } else {
    favorites.push(name);
  }

  localStorage.setItem('moodFMFavorites', JSON.stringify(favorites));

  renderStations();
}

audio.addEventListener('playing', () => {
  document.getElementById('playButton').textContent = 'Ⅱ';
  document.getElementById('playStatus').textContent = 'Now playing';
});

audio.addEventListener('error', () => {
  tryNextStation();
});

audio.volume = 0.8;
renderStations();
