import { create } from 'zustand';


// Safe disk lookup (Runs exactly once when the store boots)
const storedVolume = parseFloat(localStorage.getItem('resonance_volume'));
const initialVolume = !isNaN(storedVolume) ? storedVolume : 0.5;

const usePlayerStore = create((set, get) => ({
  // 1. The State (The Truth)
  currentTrack: null,   // Holds the track objects such as id, title, file_path, artists
  isPlaying: false,     // The play/pause boolean
  queue: [],            // The upcoming tracks (will use Doubly LinkedList later)
  recentTracks: [],
  discoverTracks: [],

  // Timeline State
  currentTime: 0,
  duration: 0,
  seekCommand: null,

  // Audio State (for Volume Slider)
  volume: initialVolume,
  isMuted: false,


  // 2. The Actions (The Mutators)
  // set() is Zustand's internal method to merge new state into the old state.
  playTrack: (track) => set({
    currentTrack: track,
    isPlaying: true
  }),

  playNext: () => set((state) => {
    // If we are not playing a song, or if we are at the Tail (no next song).
    // we do nothing, and return an empty object to tell Zustand NOT to update.
    if (!state.currentTrack || state.currentTrack.next === null) {
      return {};
    }

    // We know the next track exists, We command Zustand to overwrite the currentTrack memory address with the next track's memory address.
    return {
      currentTrack: state.currentTrack.next,
      isPlaying: true,
    }
  }),

  playPrev: () => set((state) => {
    // If we are not playing a song, or if we are at the Head (no prev song).
    // we do nothing, and return an empty object to tell Zustand NOT to update.
    if (!state.currentTrack || state.currentTrack.prev === null) {
      return {};
    }
    
    // We know the prev track exists, We command Zustand to overwrite the currentTrack memory address with the prev track's memory address.
    return {
      currentTrack: state.currentTrack.prev,
      isPlaying: true,
    }
  }),

  togglePlay: () => set((state) => ({
    // Flips the boolean based on the previous state
    isPlaying: !state.isPlaying
  })),

  // A dedicated mutator for hardware sync.
  setIsPlaying: (status) => set({ isPlaying: status }),

  // Timeline Mutators
  updateProgress: (currentTime, duration) => set({ currentTime, duration }),
  seekTo: (time) => set({ seekCommand: time }),
  clearSeekCommand: () => set({ seekCommand: null }),

  // Volume Slider Mutators
  setVolume: (newVolume) => set(() => {
    // 1. Commit to the browser's hard drive as a string
    localStorage.setItem('resonance_volume', newVolume.toString());

    // 2. Commit to the Zustand RAM as a float
    return {
      volume: newVolume,
      isMuted: newVolume === 0 // Auto Mute if they drag to 0
    };
  }),

  toggleMute: () => set((state) => {
    const newMusicState = !state.isMuted;
    return { isMuted: newMusicState };
  }),

  // Dashboard Hydration Engine
  // Dashboard Engine 1: Deterministic Cache (Fetches strictly once per boot)
  fetchRecentTracks: async () => {
    // Cache Firewall: Never refetch if we already have the data in RAM
    if (get().recentTracks.length > 0) return;

    try {
      const res = await fetch('http://localhost:3000/api/dashboard/recent');
      if (!res.ok) throw new Error('Failed to fetch recent tracks');
      
      const data = await res.json();
      set({ recentTracks: data });
    } catch (error) {
      console.error('Recent Tracks Engine Error:', error);
    }
  },

  // Dashboard Engine 2: Volatile Cache (Safe on mount, bypassable via button)
  refreshDiscoverTracks: async (force = false) => {
    // Cache Firewall: Only block if we have data AND we aren't forcing a reshuffle
    if (!force && get().discoverTracks.length > 0) return;

    try {
      const res = await fetch('http://localhost:3000/api/dashboard/discover');
      if (!res.ok) throw new Error('Failed to fetch discover tracks');
      
      const data = await res.json();
      set({ discoverTracks: data });
    } catch (error) {
      console.error('Discover Tracks Engine Error:', error);
    }
  },
  
  setQueue: (newQueue) => set({
    queue: newQueue
  }),
}));

export default usePlayerStore;
